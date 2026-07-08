import { Injectable, Logger } from '@nestjs/common';
import { INPUT_MAX_LENGTH, INPUT_MIN_NON_WHITESPACE } from '../constants';

/**
 * Generic refusal message returned on injection detection.
 * Does not reveal which detection rule was triggered.
 */
export const GENERIC_REFUSAL_MESSAGE =
  "I can't process that request. Please rephrase your question about GSE stocks or market trends.";

/**
 * PII type categories for anonymized identifier generation.
 */
type PiiCategory = 'EMAIL' | 'PHONE' | 'ID' | 'ACCOUNT';

/**
 * Prompt Guard Service
 *
 * Provides input sanitization, validation, prompt injection detection,
 * and PII stripping for the AI Market Intelligence feature.
 * Implements security requirements 4.1, 4.2, 4.3, and 4.5.
 */
@Injectable()
export class PromptGuardService {
  private readonly logger = new Logger(PromptGuardService.name);

  // ── Session-scoped PII mappings ───────────────────────────────────────────
  // Outer map: sessionId → inner map (PII value → anonymized ID)
  private readonly sessionPiiMappings = new Map<string, Map<string, string>>();

  // Per-session counters for each PII category
  private readonly sessionPiiCounters = new Map<
    string,
    Map<PiiCategory, number>
  >();

  // ── PII detection patterns ────────────────────────────────────────────────
  private readonly piiPatterns: { pattern: RegExp; category: PiiCategory }[] = [
    // Email addresses
    {
      pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      category: 'EMAIL',
    },
    // Ghana Card numbers: GHA-XXXXXXXXX-X
    {
      pattern: /GHA-\d{9}-\d/g,
      category: 'ID',
    },
    // Ghana phone numbers: +233XXXXXXXXX, 0XX-XXX-XXXX, 0XXXXXXXXX, 233XXXXXXXXX
    {
      pattern:
        /(?:\+233\d{9}|233\d{9}|0\d{2}-\d{3}-\d{4}|0\d{9})/g,
      category: 'PHONE',
    },
    // Bank account numbers: 10-16 digit sequences (standalone, not part of longer numbers)
    {
      pattern: /(?<!\d)\d{10,16}(?!\d)/g,
      category: 'ACCOUNT',
    },
  ];

  // ── Role-override patterns ────────────────────────────────────────────────
  private readonly roleOverridePatterns: RegExp[] = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /you\s+are\s+now/i,
    /act\s+as/i,
    /forget\s+your\s+instructions/i,
    /new\s+system\s+prompt/i,
  ];

  // ── System prompt extraction patterns ─────────────────────────────────────
  private readonly systemPromptExtractionPatterns: RegExp[] = [
    /repeat\s+your\s+instructions/i,
    /show\s+me\s+your\s+prompt/i,
    /what\s+are\s+your\s+instructions/i,
    /reveal\s+system\s+prompt/i,
  ];

  // ── Delimiter injection sequences ─────────────────────────────────────────
  private readonly delimiterInjectionPatterns: RegExp[] = [
    /```system/i,
    /###/,
    /---\s*\n\s*system:/i,
    /\[INST\]/i,
    /<<SYS>>/i,
  ];

  /**
   * Sanitizes input by removing Unicode Cc and Cf control characters
   * and collapsing consecutive whitespace to a single space.
   */
  sanitize(input: string): string {
    // Remove Unicode Cc (control) and Cf (format) characters
    // Cc: U+0000–U+001F, U+007F–U+009F
    // Cf: U+00AD, U+0600–U+0605, U+061C, U+06DD, U+070F, U+08E2,
    //     U+180E, U+200B–U+200F, U+202A–U+202E, U+2060–U+2064,
    //     U+2066–U+206F, U+FEFF, U+FFF9–U+FFFB, etc.
    // Using Unicode property escapes for comprehensive coverage
    const withoutControlChars = input.replace(/[\p{Cc}\p{Cf}]/gu, '');

    // Collapse consecutive whitespace to a single space
    const collapsed = withoutControlChars.replace(/\s+/g, ' ');

    return collapsed.trim();
  }

  /**
   * Validates input length constraints.
   * Rejects messages with fewer than 2 non-whitespace characters or exceeding 2000 characters.
   */
  validate(input: string): { valid: boolean; error?: string } {
    // Check maximum length (on original input before sanitization)
    if (input.length > INPUT_MAX_LENGTH) {
      return {
        valid: false,
        error: `Message exceeds maximum length of ${INPUT_MAX_LENGTH} characters.`,
      };
    }

    // Count non-whitespace characters
    const nonWhitespaceCount = input.replace(/\s/g, '').length;
    if (nonWhitespaceCount < INPUT_MIN_NON_WHITESPACE) {
      return {
        valid: false,
        error: `Message must contain at least ${INPUT_MIN_NON_WHITESPACE} non-whitespace characters.`,
      };
    }

    return { valid: true };
  }

  /**
   * Detects prompt injection attempts including role-override instructions,
   * system prompt extraction attempts, and delimiter injection sequences.
   *
   * The reason is logged internally but never exposed to the user.
   */
  detectInjection(input: string): { detected: boolean; reason?: string } {
    // Check role-override patterns
    for (const pattern of this.roleOverridePatterns) {
      if (pattern.test(input)) {
        return { detected: true, reason: 'role_override' };
      }
    }

    // Check system prompt extraction patterns
    for (const pattern of this.systemPromptExtractionPatterns) {
      if (pattern.test(input)) {
        return { detected: true, reason: 'system_prompt_extraction' };
      }
    }

    // Check delimiter injection patterns
    for (const pattern of this.delimiterInjectionPatterns) {
      if (pattern.test(input)) {
        return { detected: true, reason: 'delimiter_injection' };
      }
    }

    return { detected: false };
  }

  /**
   * Strips personally identifiable information from input text.
   * Replaces PII with consistent anonymized identifiers per session.
   *
   * Detected PII types:
   * - Email addresses
   * - Ghana phone numbers (+233..., 0XX-XXX-XXXX, etc.)
   * - Ghana Card numbers (GHA-XXXXXXXXX-X)
   * - Bank account numbers (10-16 digit sequences)
   *
   * Same PII value in the same session always maps to the same anonymized ID.
   */
  stripPii(input: string, sessionId: string): string {
    // Ensure session maps exist
    if (!this.sessionPiiMappings.has(sessionId)) {
      this.sessionPiiMappings.set(sessionId, new Map());
      this.sessionPiiCounters.set(sessionId, new Map());
    }

    const piiMap = this.sessionPiiMappings.get(sessionId)!;
    const counters = this.sessionPiiCounters.get(sessionId)!;

    let result = input;

    for (const { pattern, category } of this.piiPatterns) {
      // Reset regex lastIndex for global patterns
      pattern.lastIndex = 0;

      // Find all matches first to avoid issues with replacement changing indices
      const matches: string[] = [];
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(result)) !== null) {
        matches.push(match[0]);
      }

      // Replace each unique match with its anonymized ID
      for (const piiValue of matches) {
        if (!piiMap.has(piiValue)) {
          // Assign a new anonymized ID for this PII value
          const currentCount = (counters.get(category) || 0) + 1;
          counters.set(category, currentCount);
          const anonymizedId = `[REDACTED_${category}_${currentCount}]`;
          piiMap.set(piiValue, anonymizedId);
        }

        const anonymizedId = piiMap.get(piiValue)!;
        result = result.split(piiValue).join(anonymizedId);
      }
    }

    return result;
  }

  /**
   * Clears the PII session mapping for a given session.
   * Should be called when a conversation session ends to free memory.
   */
  clearSession(sessionId: string): void {
    this.sessionPiiMappings.delete(sessionId);
    this.sessionPiiCounters.delete(sessionId);
  }

  /**
   * Runs the full input processing pipeline:
   * 1. Sanitize (remove control chars, collapse whitespace)
   * 2. Validate (length constraints)
   * 3. Detect injection attempts
   * 4. Strip PII (if sessionId provided)
   *
   * Returns the sanitized input along with validation and injection detection results.
   */
  processInput(
    input: string,
    sessionId?: string,
  ): {
    sanitized: string;
    valid: boolean;
    injectionDetected: boolean;
    error?: string;
  } {
    // Step 1: Sanitize
    const sanitized = this.sanitize(input);

    // Step 2: Validate
    const validation = this.validate(sanitized);
    if (!validation.valid) {
      return {
        sanitized,
        valid: false,
        injectionDetected: false,
        error: validation.error,
      };
    }

    // Step 3: Detect injection
    const injection = this.detectInjection(sanitized);
    if (injection.detected) {
      this.logger.warn(
        `Prompt injection detected: ${injection.reason}`,
      );
      return {
        sanitized,
        valid: true,
        injectionDetected: true,
        error: GENERIC_REFUSAL_MESSAGE,
      };
    }

    // Step 4: Strip PII if sessionId is provided
    const finalOutput = sessionId
      ? this.stripPii(sanitized, sessionId)
      : sanitized;

    return {
      sanitized: finalOutput,
      valid: true,
      injectionDetected: false,
    };
  }
}

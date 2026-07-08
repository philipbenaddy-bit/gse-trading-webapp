"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PromptGuardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptGuardService = exports.GENERIC_REFUSAL_MESSAGE = void 0;
const common_1 = require("@nestjs/common");
const constants_1 = require("../constants");
exports.GENERIC_REFUSAL_MESSAGE = "I can't process that request. Please rephrase your question about GSE stocks or market trends.";
let PromptGuardService = PromptGuardService_1 = class PromptGuardService {
    constructor() {
        this.logger = new common_1.Logger(PromptGuardService_1.name);
        this.sessionPiiMappings = new Map();
        this.sessionPiiCounters = new Map();
        this.piiPatterns = [
            {
                pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
                category: 'EMAIL',
            },
            {
                pattern: /GHA-\d{9}-\d/g,
                category: 'ID',
            },
            {
                pattern: /(?:\+233\d{9}|233\d{9}|0\d{2}-\d{3}-\d{4}|0\d{9})/g,
                category: 'PHONE',
            },
            {
                pattern: /(?<!\d)\d{10,16}(?!\d)/g,
                category: 'ACCOUNT',
            },
        ];
        this.roleOverridePatterns = [
            /ignore\s+(all\s+)?previous\s+instructions/i,
            /you\s+are\s+now/i,
            /act\s+as/i,
            /forget\s+your\s+instructions/i,
            /new\s+system\s+prompt/i,
        ];
        this.systemPromptExtractionPatterns = [
            /repeat\s+your\s+instructions/i,
            /show\s+me\s+your\s+prompt/i,
            /what\s+are\s+your\s+instructions/i,
            /reveal\s+system\s+prompt/i,
        ];
        this.delimiterInjectionPatterns = [
            /```system/i,
            /###/,
            /---\s*\n\s*system:/i,
            /\[INST\]/i,
            /<<SYS>>/i,
        ];
    }
    sanitize(input) {
        const withoutControlChars = input.replace(/[\p{Cc}\p{Cf}]/gu, '');
        const collapsed = withoutControlChars.replace(/\s+/g, ' ');
        return collapsed.trim();
    }
    validate(input) {
        if (input.length > constants_1.INPUT_MAX_LENGTH) {
            return {
                valid: false,
                error: `Message exceeds maximum length of ${constants_1.INPUT_MAX_LENGTH} characters.`,
            };
        }
        const nonWhitespaceCount = input.replace(/\s/g, '').length;
        if (nonWhitespaceCount < constants_1.INPUT_MIN_NON_WHITESPACE) {
            return {
                valid: false,
                error: `Message must contain at least ${constants_1.INPUT_MIN_NON_WHITESPACE} non-whitespace characters.`,
            };
        }
        return { valid: true };
    }
    detectInjection(input) {
        for (const pattern of this.roleOverridePatterns) {
            if (pattern.test(input)) {
                return { detected: true, reason: 'role_override' };
            }
        }
        for (const pattern of this.systemPromptExtractionPatterns) {
            if (pattern.test(input)) {
                return { detected: true, reason: 'system_prompt_extraction' };
            }
        }
        for (const pattern of this.delimiterInjectionPatterns) {
            if (pattern.test(input)) {
                return { detected: true, reason: 'delimiter_injection' };
            }
        }
        return { detected: false };
    }
    stripPii(input, sessionId) {
        if (!this.sessionPiiMappings.has(sessionId)) {
            this.sessionPiiMappings.set(sessionId, new Map());
            this.sessionPiiCounters.set(sessionId, new Map());
        }
        const piiMap = this.sessionPiiMappings.get(sessionId);
        const counters = this.sessionPiiCounters.get(sessionId);
        let result = input;
        for (const { pattern, category } of this.piiPatterns) {
            pattern.lastIndex = 0;
            const matches = [];
            let match;
            while ((match = pattern.exec(result)) !== null) {
                matches.push(match[0]);
            }
            for (const piiValue of matches) {
                if (!piiMap.has(piiValue)) {
                    const currentCount = (counters.get(category) || 0) + 1;
                    counters.set(category, currentCount);
                    const anonymizedId = `[REDACTED_${category}_${currentCount}]`;
                    piiMap.set(piiValue, anonymizedId);
                }
                const anonymizedId = piiMap.get(piiValue);
                result = result.split(piiValue).join(anonymizedId);
            }
        }
        return result;
    }
    clearSession(sessionId) {
        this.sessionPiiMappings.delete(sessionId);
        this.sessionPiiCounters.delete(sessionId);
    }
    processInput(input, sessionId) {
        const sanitized = this.sanitize(input);
        const validation = this.validate(sanitized);
        if (!validation.valid) {
            return {
                sanitized,
                valid: false,
                injectionDetected: false,
                error: validation.error,
            };
        }
        const injection = this.detectInjection(sanitized);
        if (injection.detected) {
            this.logger.warn(`Prompt injection detected: ${injection.reason}`);
            return {
                sanitized,
                valid: true,
                injectionDetected: true,
                error: exports.GENERIC_REFUSAL_MESSAGE,
            };
        }
        const finalOutput = sessionId
            ? this.stripPii(sanitized, sessionId)
            : sanitized;
        return {
            sanitized: finalOutput,
            valid: true,
            injectionDetected: false,
        };
    }
};
exports.PromptGuardService = PromptGuardService;
exports.PromptGuardService = PromptGuardService = PromptGuardService_1 = __decorate([
    (0, common_1.Injectable)()
], PromptGuardService);
//# sourceMappingURL=prompt-guard.service.js.map
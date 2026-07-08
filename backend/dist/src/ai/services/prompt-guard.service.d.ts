export declare const GENERIC_REFUSAL_MESSAGE = "I can't process that request. Please rephrase your question about GSE stocks or market trends.";
export declare class PromptGuardService {
    private readonly logger;
    private readonly sessionPiiMappings;
    private readonly sessionPiiCounters;
    private readonly piiPatterns;
    private readonly roleOverridePatterns;
    private readonly systemPromptExtractionPatterns;
    private readonly delimiterInjectionPatterns;
    sanitize(input: string): string;
    validate(input: string): {
        valid: boolean;
        error?: string;
    };
    detectInjection(input: string): {
        detected: boolean;
        reason?: string;
    };
    stripPii(input: string, sessionId: string): string;
    clearSession(sessionId: string): void;
    processInput(input: string, sessionId?: string): {
        sanitized: string;
        valid: boolean;
        injectionDetected: boolean;
        error?: string;
    };
}

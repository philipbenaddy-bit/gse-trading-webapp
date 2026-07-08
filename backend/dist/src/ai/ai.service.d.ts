import { ConfigService } from '@nestjs/config';
import { GseService } from '../gse/gse.service';
import { PromptGuardService } from './services/prompt-guard.service';
import { ContextBuilderService } from './services/context-builder.service';
import { RateLimiterService } from './services/rate-limiter.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { ConversationStoreService } from './services/conversation-store.service';
import { DisclaimerEngineService } from './services/disclaimer-engine.service';
import { AuditLoggerService } from './services/audit-logger.service';
import { ChatMessage, RateLimitInfo } from './interfaces/ai.interfaces';
import { ChatResponseDto } from './dto/chat.dto';
export interface AiInsight {
    symbol: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    score: number;
    summary: string;
    keyPoints: string[];
    recommendation: 'buy' | 'sell' | 'hold';
    confidence: number;
}
export interface PortfolioAnalysis {
    overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    summary: string;
    strengths: string[];
    risks: string[];
    suggestions: string[];
    diversificationScore: number;
    riskLevel: 'low' | 'medium' | 'high';
}
export declare class AiService {
    private readonly config;
    private readonly gseService;
    private readonly promptGuardService;
    private readonly contextBuilderService;
    private readonly rateLimiterService;
    private readonly circuitBreakerService;
    private readonly conversationStoreService;
    private readonly disclaimerEngineService;
    private readonly auditLoggerService;
    private readonly logger;
    private readonly openaiKey;
    private readonly anthropicKey;
    constructor(config: ConfigService, gseService: GseService, promptGuardService: PromptGuardService, contextBuilderService: ContextBuilderService, rateLimiterService: RateLimiterService, circuitBreakerService: CircuitBreakerService, conversationStoreService: ConversationStoreService, disclaimerEngineService: DisclaimerEngineService, auditLoggerService: AuditLoggerService);
    private get hasAiKey();
    chat(userId: string, message: string, conversationId?: string): Promise<ChatResponseDto>;
    callLLM(messages: ChatMessage[], maxTokens?: number): Promise<string>;
    private callOpenAI;
    private callAnthropic;
    validateOutput(response: string): boolean;
    private buildContextBlock;
    private generateConversationTitle;
    private estimateTokenCount;
    private isSentimentQuery;
    private generateFallbackResponse;
    legacyChat(message: string, history: ChatMessage[], userId: string): Promise<string>;
    getStockInsight(symbol: string): Promise<AiInsight>;
    private buildFallbackInsight;
    getNewsSentiment(symbol: string, headlines: string[]): Promise<{
        sentiment: string;
        score: number;
        summary: string;
    }>;
    analyzePortfolio(holdings: any[], summary: any): Promise<PortfolioAnalysis>;
    private buildFallbackPortfolioAnalysis;
}
export declare class RateLimitExceededError extends Error {
    readonly rateLimitInfo: RateLimitInfo;
    constructor(rateLimitInfo: RateLimitInfo);
}

import { AiService } from './ai.service';
import { ConversationStoreService } from './services/conversation-store.service';
import { InsightGeneratorService } from './services/insight-generator.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { RateLimiterService } from './services/rate-limiter.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import { ChatDto, SentimentDto, SendMessageDto, ChatResponseDto } from './dto/chat.dto';
import { DisclaimerEngineService } from './services/disclaimer-engine.service';
export declare class AiController {
    private readonly aiService;
    private readonly conversationStoreService;
    private readonly insightGeneratorService;
    private readonly circuitBreakerService;
    private readonly rateLimiterService;
    private readonly portfolioService;
    private readonly disclaimerEngine;
    constructor(aiService: AiService, conversationStoreService: ConversationStoreService, insightGeneratorService: InsightGeneratorService, circuitBreakerService: CircuitBreakerService, rateLimiterService: RateLimiterService, portfolioService: PortfolioService, disclaimerEngine: DisclaimerEngineService);
    sendMessage(dto: SendMessageDto, req: any): Promise<ChatResponseDto>;
    createConversation(req: any): Promise<import("./interfaces").ConversationThread>;
    listConversations(req: any): Promise<{
        conversations: import("./interfaces").ConversationThread[];
    }>;
    getConversation(id: string, req: any): Promise<{
        messages: import("./interfaces").ConversationMessage[];
        id: string;
        userId: string;
        title: string;
        createdAt: string;
        updatedAt: string;
        messageCount: number;
    }>;
    deleteConversation(id: string, req: any): Promise<void>;
    getInsights(req: any): Promise<{
        insights: import("./interfaces").InsightCard[];
    }>;
    getStatus(): Promise<import("./interfaces").CircuitBreakerState>;
    getRateLimit(req: any): Promise<import("./interfaces").RateLimitInfo>;
    legacyChat(dto: ChatDto, req: any): Promise<{
        reply: string;
    }>;
    getStockInsight(symbol: string): Promise<import("./ai.service").AiInsight>;
    getSentiment(symbol: string, dto: SentimentDto): Promise<{
        sentiment: string;
        score: number;
        summary: string;
    }>;
    analyzePortfolio(req: any): Promise<import("./ai.service").PortfolioAnalysis>;
}

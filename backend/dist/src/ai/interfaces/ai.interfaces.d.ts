export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface ConversationThread {
    id: string;
    userId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messageCount: number;
}
export interface ConversationMessage {
    id: string;
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    tokenCount: number;
    createdAt: string;
}
export interface PromptContext {
    marketData?: MarketDataContext;
    portfolioData?: PortfolioDataContext;
    newsData?: NewsDataContext;
    conversationHistory: ChatMessage[];
    dataFreshness: Record<string, string>;
    unavailableSources: string[];
}
export interface MarketDataContext {
    requestedStock?: {
        symbol: string;
        price: number;
        changePercent: number;
        volume: number;
    };
    compositeIndex?: number;
    topGainers: {
        symbol: string;
        changePercent: number;
    }[];
    topLosers: {
        symbol: string;
        changePercent: number;
    }[];
    lastUpdated: string;
}
export interface PortfolioDataContext {
    holdings: {
        symbol: string;
        quantity: number;
        averageCost: number;
        currentValue: number;
        unrealizedGainLoss: number;
    }[];
    totalValue: number;
    totalPnl: number;
}
export interface NewsDataContext {
    articles: {
        title: string;
        summary: string;
        source: string;
        publishedAt: string;
        relatedSymbols: string[];
    }[];
}
export interface InsightCard {
    id: string;
    title: string;
    summary: string;
    relevanceSymbol: string;
    disclaimer: string;
    generatedAt: string;
}
export interface AuditRecord {
    id: string;
    userId: string;
    timestamp: string;
    requestType: 'chat' | 'insight' | 'portfolio_analysis';
    tokenCount: number;
    responseStatus: 'success' | 'error' | 'timeout' | 'rate_limited' | 'rejected';
    durationMs?: number;
}
export interface SecurityEvent {
    id: string;
    userId: string;
    timestamp: string;
    sanitizedInput: string;
    detectionReason: string;
}
export interface RateLimitInfo {
    hourlyRemaining: number;
    dailyRemaining: number;
    resetInSeconds: number;
    limitExceeded: 'hourly' | 'daily' | null;
}
export interface CircuitBreakerState {
    state: 'closed' | 'open' | 'half-open';
    failureCount: number;
    lastFailure: string | null;
    nextRetryAt: string | null;
}

/**
 * AI Market Intelligence - Core Interfaces
 *
 * Defines all TypeScript interfaces for the AI module including
 * conversation management, prompt context assembly, insight cards,
 * audit/compliance records, rate limiting, and circuit breaker state.
 */

// ── Conversation & Chat ─────────────────────────────────────────────────────

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

// ── Prompt Context Assembly ─────────────────────────────────────────────────

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
  topGainers: { symbol: string; changePercent: number }[];
  topLosers: { symbol: string; changePercent: number }[];
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

// ── Insight Cards ───────────────────────────────────────────────────────────

export interface InsightCard {
  id: string;
  title: string; // max 80 chars
  summary: string; // max 150 chars
  relevanceSymbol: string;
  disclaimer: string;
  generatedAt: string;
}

// ── Audit & Compliance ──────────────────────────────────────────────────────

export interface AuditRecord {
  id: string;
  userId: string;
  timestamp: string; // ISO 8601 UTC
  requestType: 'chat' | 'insight' | 'portfolio_analysis';
  tokenCount: number;
  responseStatus: 'success' | 'error' | 'timeout' | 'rate_limited' | 'rejected';
  durationMs?: number;
}

export interface SecurityEvent {
  id: string;
  userId: string;
  timestamp: string;
  sanitizedInput: string; // max 2000 chars
  detectionReason: string;
}

// ── Rate Limiting ───────────────────────────────────────────────────────────

export interface RateLimitInfo {
  hourlyRemaining: number;
  dailyRemaining: number;
  resetInSeconds: number;
  limitExceeded: 'hourly' | 'daily' | null;
}

// ── Circuit Breaker ─────────────────────────────────────────────────────────

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailure: string | null;
  nextRetryAt: string | null;
}

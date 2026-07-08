/**
 * Frontend TypeScript types for AI Market Intelligence.
 * Mirrors the backend interfaces for type-safe API communication.
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
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

export interface InsightCard {
  id: string;
  title: string;
  summary: string;
  relevanceSymbol: string;
  disclaimer: string;
  generatedAt: string;
}

export interface ChatResponseDto {
  conversationId: string;
  messageId: string;
  reply: string;
  disclaimer: string;
  rateLimitInfo: RateLimitInfo;
  dataSources: string[];
}

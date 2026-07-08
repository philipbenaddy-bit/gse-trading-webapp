import api from './api';
import type {
  ChatResponseDto,
  ConversationThread,
  ConversationMessage,
  InsightCard,
  RateLimitInfo,
  CircuitBreakerState,
} from '../types/ai';

/**
 * AI Market Intelligence API client.
 * Uses the shared axios instance with auth interceptors from api.ts.
 */

/** Send a message to the AI assistant */
export function sendMessage(message: string, conversationId?: string) {
  return api.post<ChatResponseDto>('/ai/chat', { message, conversationId });
}

/** Create a new conversation thread */
export function createConversation() {
  return api.post<ConversationThread>('/ai/conversations');
}

/** List all conversations for the authenticated user */
export function getConversations() {
  return api.get<ConversationThread[]>('/ai/conversations');
}

/** Get full conversation history by ID */
export function getConversation(id: string) {
  return api.get<{ conversation: ConversationThread; messages: ConversationMessage[] }>(
    `/ai/conversations/${id}`,
  );
}

/** Delete a conversation */
export function deleteConversation(id: string) {
  return api.delete(`/ai/conversations/${id}`);
}

/** Get AI-generated dashboard insight cards */
export function getInsights() {
  return api.get<InsightCard[]>('/ai/insights');
}

/** Get AI service status (circuit breaker state) */
export function getAiStatus() {
  return api.get<CircuitBreakerState>('/ai/status');
}

/** Get current rate limit status for the authenticated user */
export function getRateLimit() {
  return api.get<RateLimitInfo>('/ai/rate-limit');
}

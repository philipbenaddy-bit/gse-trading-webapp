import { useQuery } from 'react-query';
import { getConversations, getConversation } from '../lib/aiApi';
import type { ConversationThread, ConversationMessage } from '../types/ai';

/**
 * React Query hook for fetching the user's conversation list.
 * Refetches on window focus and keeps data fresh for 30 seconds.
 */
export function useAiConversations() {
  return useQuery<ConversationThread[]>(
    'ai-conversations',
    () => getConversations().then((res) => res.data),
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: true,
    },
  );
}

/**
 * React Query hook for fetching a single conversation's full history.
 * Only fetches when a valid conversation ID is provided.
 */
export function useAiConversationHistory(conversationId: string | null) {
  return useQuery<{ conversation: ConversationThread; messages: ConversationMessage[] }>(
    ['ai-conversation', conversationId],
    () => getConversation(conversationId!).then((res) => res.data),
    {
      enabled: !!conversationId,
      staleTime: 60 * 1000, // 1 minute
    },
  );
}

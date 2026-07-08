import { useMutation, useQueryClient } from 'react-query';
import { sendMessage } from '../lib/aiApi';
import { useAiChatStore } from '../store/aiChatStore';
import type { ChatResponseDto } from '../types/ai';

interface SendMessageParams {
  message: string;
  conversationId?: string;
}

/**
 * React Query mutation hook for sending AI chat messages.
 * Integrates with the Zustand store for optimistic updates and state sync.
 */
export function useAiChat() {
  const queryClient = useQueryClient();
  const { setTyping } = useAiChatStore();

  const mutation = useMutation<ChatResponseDto, Error, SendMessageParams>(
    async ({ message, conversationId }) => {
      const res = await sendMessage(message, conversationId);
      return res.data;
    },
    {
      onMutate: () => {
        setTyping(true);
      },
      onSuccess: (data) => {
        setTyping(false);
        // Invalidate conversations list to reflect updated timestamps
        queryClient.invalidateQueries('ai-conversations');
      },
      onError: () => {
        setTyping(false);
      },
    },
  );

  return {
    sendMessage: mutation.mutate,
    sendMessageAsync: mutation.mutateAsync,
    isLoading: mutation.isLoading,
    isError: mutation.isError,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}

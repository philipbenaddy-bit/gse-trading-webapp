import { create } from 'zustand';
import type {
  ChatMessage,
  ConversationThread,
  RateLimitInfo,
  CircuitBreakerState,
} from '../types/ai';
import * as aiApi from '../lib/aiApi';

interface AiChatState {
  // Conversation state
  messages: ChatMessage[];
  activeConversationId: string | null;
  conversations: ConversationThread[];

  // UI state
  isTyping: boolean;
  error: string | null;

  // Service state
  circuitBreakerStatus: CircuitBreakerState;
  rateLimitInfo: RateLimitInfo | null;

  // Actions
  sendMessage: (message: string) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  createConversation: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  setTyping: (typing: boolean) => void;
  updateStatus: () => Promise<void>;
  loadConversations: () => Promise<void>;
  clearError: () => void;
  resetChat: () => void;
}

const MAX_SESSION_MESSAGES = 50;

export const useAiChatStore = create<AiChatState>((set, get) => ({
  // Initial state
  messages: [],
  activeConversationId: null,
  conversations: [],
  isTyping: false,
  error: null,
  circuitBreakerStatus: {
    state: 'closed',
    failureCount: 0,
    lastFailure: null,
    nextRetryAt: null,
  },
  rateLimitInfo: null,

  sendMessage: async (message: string) => {
    const { activeConversationId, messages } = get();

    // Optimistically add user message
    const userMessage: ChatMessage = { role: 'user', content: message };
    const updatedMessages = [...messages, userMessage].slice(-MAX_SESSION_MESSAGES);
    set({ messages: updatedMessages, isTyping: true, error: null });

    try {
      const res = await aiApi.sendMessage(message, activeConversationId ?? undefined);
      const data = res.data;

      const assistantMessage: ChatMessage = { role: 'assistant', content: data.reply };
      const newMessages = [...get().messages, assistantMessage].slice(-MAX_SESSION_MESSAGES);

      set({
        messages: newMessages,
        activeConversationId: data.conversationId,
        rateLimitInfo: data.rateLimitInfo,
        isTyping: false,
      });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to send message. Please try again.';
      set({ isTyping: false, error: errorMessage });
    }
  },

  loadConversation: async (id: string) => {
    set({ error: null });
    try {
      const res = await aiApi.getConversation(id);
      const { conversation, messages: conversationMessages } = res.data;

      const chatMessages: ChatMessage[] = conversationMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      set({
        activeConversationId: conversation.id,
        messages: chatMessages.slice(-MAX_SESSION_MESSAGES),
      });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to load conversation.';
      set({ error: errorMessage });
    }
  },

  createConversation: async () => {
    set({ error: null });
    try {
      const res = await aiApi.createConversation();
      const conversation = res.data;

      set({
        activeConversationId: conversation.id,
        messages: [],
        conversations: [conversation, ...get().conversations],
      });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to create conversation.';
      set({ error: errorMessage });
    }
  },

  deleteConversation: async (id: string) => {
    set({ error: null });
    try {
      await aiApi.deleteConversation(id);

      const { activeConversationId, conversations } = get();
      const updated = conversations.filter((c) => c.id !== id);

      set({
        conversations: updated,
        ...(activeConversationId === id
          ? { activeConversationId: null, messages: [] }
          : {}),
      });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to delete conversation.';
      set({ error: errorMessage });
    }
  },

  setTyping: (typing: boolean) => set({ isTyping: typing }),

  updateStatus: async () => {
    try {
      const [statusRes, rateLimitRes] = await Promise.all([
        aiApi.getAiStatus(),
        aiApi.getRateLimit(),
      ]);
      set({
        circuitBreakerStatus: statusRes.data,
        rateLimitInfo: rateLimitRes.data,
      });
    } catch {
      // Status update failures are non-critical
    }
  },

  loadConversations: async () => {
    try {
      const res = await aiApi.getConversations();
      set({ conversations: res.data });
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || 'Failed to load conversations.';
      set({ error: errorMessage });
    }
  },

  clearError: () => set({ error: null }),

  resetChat: () =>
    set({
      messages: [],
      activeConversationId: null,
      isTyping: false,
      error: null,
    }),
}));

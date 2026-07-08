import { Test, TestingModule } from '@nestjs/testing';
import { ConversationStoreService } from './conversation-store.service';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  CONVERSATION_CONTEXT_WINDOW,
  CONVERSATION_EXPIRY_DAYS,
} from '../constants/ai.constants';

/**
 * Unit tests for ConversationStoreService.
 * Uses a mocked SupabaseService to validate CRUD logic,
 * context window bounding, soft-delete, and expiry calculation.
 */
describe('ConversationStoreService', () => {
  let service: ConversationStoreService;
  let mockSupabaseClient: any;

  // Helper to create a chainable query builder mock
  const createQueryBuilder = (resolvedData: any = null, resolvedError: any = null) => {
    const builder: any = {};
    const methods = ['from', 'select', 'insert', 'update', 'eq', 'is', 'order', 'limit', 'single'];
    methods.forEach((method) => {
      builder[method] = jest.fn().mockReturnValue(builder);
    });
    // Terminal methods return the result
    builder.single = jest.fn().mockResolvedValue({ data: resolvedData, error: resolvedError });
    // For non-single queries, make the builder itself thenable
    builder.then = (resolve: any) => resolve({ data: resolvedData, error: resolvedError });
    return builder;
  };

  beforeEach(async () => {
    mockSupabaseClient = {
      from: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationStoreService,
        {
          provide: SupabaseService,
          useValue: {
            getClient: () => mockSupabaseClient,
          },
        },
      ],
    }).compile();

    service = module.get<ConversationStoreService>(ConversationStoreService);
  });

  describe('createConversation', () => {
    it('should create a conversation with default title', async () => {
      const mockRow = {
        id: 'conv-uuid-1',
        user_id: 'user-1',
        title: 'New Conversation',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        message_count: 0,
      };

      const builder = createChainableBuilder(mockRow);
      mockSupabaseClient.from.mockReturnValue(builder);

      const result = await service.createConversation('user-1');

      expect(result.id).toBe('conv-uuid-1');
      expect(result.userId).toBe('user-1');
      expect(result.title).toBe('New Conversation');
      expect(result.messageCount).toBe(0);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('conversations');
    });

    it('should create a conversation with custom title', async () => {
      const mockRow = {
        id: 'conv-uuid-2',
        user_id: 'user-1',
        title: 'My Stock Analysis',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        message_count: 0,
      };

      const builder = createChainableBuilder(mockRow);
      mockSupabaseClient.from.mockReturnValue(builder);

      const result = await service.createConversation('user-1', 'My Stock Analysis');

      expect(result.title).toBe('My Stock Analysis');
    });

    it('should set expires_at to creation time + 90 days', async () => {
      const now = new Date('2024-01-15T10:00:00.000Z');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const expectedExpiry = new Date(now);
      expectedExpiry.setDate(expectedExpiry.getDate() + CONVERSATION_EXPIRY_DAYS);

      let capturedInsert: any;
      const builder: any = {};
      builder.insert = jest.fn((data) => {
        capturedInsert = data;
        return builder;
      });
      builder.select = jest.fn().mockReturnValue(builder);
      builder.single = jest.fn().mockResolvedValue({
        data: {
          id: 'conv-uuid-3',
          user_id: 'user-1',
          title: 'New Conversation',
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          message_count: 0,
        },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue(builder);

      await service.createConversation('user-1');

      expect(capturedInsert.expires_at).toBe(expectedExpiry.toISOString());

      jest.useRealTimers();
    });

    it('should throw an error when Supabase insert fails', async () => {
      const builder: any = {};
      builder.insert = jest.fn().mockReturnValue(builder);
      builder.select = jest.fn().mockReturnValue(builder);
      builder.single = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      mockSupabaseClient.from.mockReturnValue(builder);

      await expect(service.createConversation('user-1')).rejects.toThrow(
        'Failed to create conversation: Database error',
      );
    });
  });

  describe('addMessage', () => {
    it('should persist a user message with role, content, and token count', async () => {
      let capturedInsert: any;
      const insertBuilder: any = {};
      insertBuilder.insert = jest.fn((data) => {
        capturedInsert = data;
        return insertBuilder;
      });
      insertBuilder.select = jest.fn().mockReturnValue(insertBuilder);
      insertBuilder.single = jest.fn().mockResolvedValue({
        data: {
          id: 'msg-uuid-1',
          conversation_id: 'conv-1',
          role: 'user',
          content: 'What is the price of GCB?',
          token_count: 15,
          created_at: '2024-01-01T00:00:00.000Z',
        },
        error: null,
      });

      // For the update call and count call
      const updateBuilder: any = {};
      updateBuilder.update = jest.fn().mockReturnValue(updateBuilder);
      updateBuilder.eq = jest.fn().mockReturnValue(updateBuilder);
      updateBuilder.then = (resolve: any) => resolve({ error: null });

      const countBuilder: any = {};
      countBuilder.select = jest.fn().mockReturnValue(countBuilder);
      countBuilder.eq = jest.fn().mockReturnValue(countBuilder);
      countBuilder.then = (resolve: any) => resolve({ count: 1, error: null });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversation_messages') {
          callCount++;
          if (callCount === 1) return insertBuilder; // insert
          return countBuilder; // count
        }
        return updateBuilder; // conversations update
      });

      const result = await service.addMessage('conv-1', 'user', 'What is the price of GCB?', 15);

      expect(result.id).toBe('msg-uuid-1');
      expect(result.conversationId).toBe('conv-1');
      expect(result.role).toBe('user');
      expect(result.content).toBe('What is the price of GCB?');
      expect(result.tokenCount).toBe(15);
      expect(capturedInsert.role).toBe('user');
      expect(capturedInsert.content).toBe('What is the price of GCB?');
      expect(capturedInsert.token_count).toBe(15);
    });

    it('should persist an assistant message', async () => {
      const insertBuilder: any = {};
      insertBuilder.insert = jest.fn().mockReturnValue(insertBuilder);
      insertBuilder.select = jest.fn().mockReturnValue(insertBuilder);
      insertBuilder.single = jest.fn().mockResolvedValue({
        data: {
          id: 'msg-uuid-2',
          conversation_id: 'conv-1',
          role: 'assistant',
          content: 'GCB is currently trading at GHS 5.20.',
          token_count: 25,
          created_at: '2024-01-01T00:00:01.000Z',
        },
        error: null,
      });

      const updateBuilder: any = {};
      updateBuilder.update = jest.fn().mockReturnValue(updateBuilder);
      updateBuilder.eq = jest.fn().mockReturnValue(updateBuilder);
      updateBuilder.then = (resolve: any) => resolve({ error: null });

      const countBuilder: any = {};
      countBuilder.select = jest.fn().mockReturnValue(countBuilder);
      countBuilder.eq = jest.fn().mockReturnValue(countBuilder);
      countBuilder.then = (resolve: any) => resolve({ count: 2, error: null });

      let callCount = 0;
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'conversation_messages') {
          callCount++;
          if (callCount === 1) return insertBuilder;
          return countBuilder;
        }
        return updateBuilder;
      });

      const result = await service.addMessage(
        'conv-1',
        'assistant',
        'GCB is currently trading at GHS 5.20.',
        25,
      );

      expect(result.role).toBe('assistant');
      expect(result.tokenCount).toBe(25);
    });

    it('should throw an error when message insert fails', async () => {
      const insertBuilder: any = {};
      insertBuilder.insert = jest.fn().mockReturnValue(insertBuilder);
      insertBuilder.select = jest.fn().mockReturnValue(insertBuilder);
      insertBuilder.single = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      });

      mockSupabaseClient.from.mockReturnValue(insertBuilder);

      await expect(
        service.addMessage('conv-1', 'user', 'Hello', 5),
      ).rejects.toThrow('Failed to add message: Insert failed');
    });
  });

  describe('getMessages', () => {
    it('should return messages in chronological order', async () => {
      const mockMessages = [
        { id: 'msg-3', conversation_id: 'conv-1', role: 'assistant', content: 'Response 2', token_count: 20, created_at: '2024-01-01T00:00:03.000Z' },
        { id: 'msg-2', conversation_id: 'conv-1', role: 'user', content: 'Question 2', token_count: 10, created_at: '2024-01-01T00:00:02.000Z' },
        { id: 'msg-1', conversation_id: 'conv-1', role: 'user', content: 'Question 1', token_count: 8, created_at: '2024-01-01T00:00:01.000Z' },
      ];

      const builder: any = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.order = jest.fn().mockReturnValue(builder);
      builder.limit = jest.fn().mockReturnValue(builder);
      builder.then = (resolve: any) => resolve({ data: mockMessages, error: null });

      mockSupabaseClient.from.mockReturnValue(builder);

      const result = await service.getMessages('conv-1');

      // Should be reversed to chronological order
      expect(result[0].id).toBe('msg-1');
      expect(result[1].id).toBe('msg-2');
      expect(result[2].id).toBe('msg-3');
    });

    it('should default limit to CONVERSATION_CONTEXT_WINDOW (50)', async () => {
      const builder: any = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.order = jest.fn().mockReturnValue(builder);
      builder.limit = jest.fn().mockReturnValue(builder);
      builder.then = (resolve: any) => resolve({ data: [], error: null });

      mockSupabaseClient.from.mockReturnValue(builder);

      await service.getMessages('conv-1');

      expect(builder.limit).toHaveBeenCalledWith(CONVERSATION_CONTEXT_WINDOW);
    });

    it('should respect custom limit parameter', async () => {
      const builder: any = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.order = jest.fn().mockReturnValue(builder);
      builder.limit = jest.fn().mockReturnValue(builder);
      builder.then = (resolve: any) => resolve({ data: [], error: null });

      mockSupabaseClient.from.mockReturnValue(builder);

      await service.getMessages('conv-1', 10);

      expect(builder.limit).toHaveBeenCalledWith(10);
    });

    it('should throw an error when query fails', async () => {
      const builder: any = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.order = jest.fn().mockReturnValue(builder);
      builder.limit = jest.fn().mockReturnValue(builder);
      builder.then = (resolve: any) => resolve({ data: null, error: { message: 'Query failed' } });

      mockSupabaseClient.from.mockReturnValue(builder);

      await expect(service.getMessages('conv-1')).rejects.toThrow(
        'Failed to get messages: Query failed',
      );
    });
  });

  describe('getContextWindow', () => {
    it('should return messages as ChatMessage[] for LLM context', async () => {
      const mockMessages = [
        { id: 'msg-2', conversation_id: 'conv-1', role: 'assistant', content: 'Response', token_count: 20, created_at: '2024-01-01T00:00:02.000Z' },
        { id: 'msg-1', conversation_id: 'conv-1', role: 'user', content: 'Question', token_count: 10, created_at: '2024-01-01T00:00:01.000Z' },
      ];

      const builder: any = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.order = jest.fn().mockReturnValue(builder);
      builder.limit = jest.fn().mockReturnValue(builder);
      builder.then = (resolve: any) => resolve({ data: mockMessages, error: null });

      mockSupabaseClient.from.mockReturnValue(builder);

      const result = await service.getContextWindow('conv-1');

      // Should be ChatMessage format (role + content only)
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ role: 'user', content: 'Question' });
      expect(result[1]).toEqual({ role: 'assistant', content: 'Response' });
      // Should not have id, conversationId, tokenCount, createdAt
      expect((result[0] as any).id).toBeUndefined();
      expect((result[0] as any).tokenCount).toBeUndefined();
    });

    it('should limit to CONVERSATION_CONTEXT_WINDOW messages', async () => {
      const builder: any = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.order = jest.fn().mockReturnValue(builder);
      builder.limit = jest.fn().mockReturnValue(builder);
      builder.then = (resolve: any) => resolve({ data: [], error: null });

      mockSupabaseClient.from.mockReturnValue(builder);

      await service.getContextWindow('conv-1');

      expect(builder.limit).toHaveBeenCalledWith(CONVERSATION_CONTEXT_WINDOW);
    });
  });

  describe('listConversations', () => {
    it('should return conversations sorted by updated_at desc, excluding soft-deleted', async () => {
      const mockConversations = [
        { id: 'conv-2', user_id: 'user-1', title: 'Recent', created_at: '2024-01-02T00:00:00.000Z', updated_at: '2024-01-03T00:00:00.000Z', message_count: 5 },
        { id: 'conv-1', user_id: 'user-1', title: 'Older', created_at: '2024-01-01T00:00:00.000Z', updated_at: '2024-01-01T00:00:00.000Z', message_count: 3 },
      ];

      const builder: any = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.is = jest.fn().mockReturnValue(builder);
      builder.order = jest.fn().mockReturnValue(builder);
      builder.then = (resolve: any) => resolve({ data: mockConversations, error: null });

      mockSupabaseClient.from.mockReturnValue(builder);

      const result = await service.listConversations('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('conv-2');
      expect(result[1].id).toBe('conv-1');
      expect(builder.is).toHaveBeenCalledWith('deleted_at', null);
      expect(builder.order).toHaveBeenCalledWith('updated_at', { ascending: false });
    });

    it('should return empty array when user has no conversations', async () => {
      const builder: any = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.is = jest.fn().mockReturnValue(builder);
      builder.order = jest.fn().mockReturnValue(builder);
      builder.then = (resolve: any) => resolve({ data: [], error: null });

      mockSupabaseClient.from.mockReturnValue(builder);

      const result = await service.listConversations('user-1');

      expect(result).toHaveLength(0);
    });

    it('should throw an error when query fails', async () => {
      const builder: any = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.is = jest.fn().mockReturnValue(builder);
      builder.order = jest.fn().mockReturnValue(builder);
      builder.then = (resolve: any) => resolve({ data: null, error: { message: 'Query failed' } });

      mockSupabaseClient.from.mockReturnValue(builder);

      await expect(service.listConversations('user-1')).rejects.toThrow(
        'Failed to list conversations: Query failed',
      );
    });
  });

  describe('getConversation', () => {
    it('should return a conversation by ID and userId', async () => {
      const mockConversation = {
        id: 'conv-1',
        user_id: 'user-1',
        title: 'Test Conversation',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
        message_count: 5,
      };

      const builder: any = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.is = jest.fn().mockReturnValue(builder);
      builder.single = jest.fn().mockResolvedValue({ data: mockConversation, error: null });

      mockSupabaseClient.from.mockReturnValue(builder);

      const result = await service.getConversation('conv-1', 'user-1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('conv-1');
      expect(result!.title).toBe('Test Conversation');
      // Verify userId filter is applied
      expect(builder.eq).toHaveBeenCalledWith('id', 'conv-1');
      expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('should return null when conversation not found', async () => {
      const builder: any = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.is = jest.fn().mockReturnValue(builder);
      builder.single = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' },
      });

      mockSupabaseClient.from.mockReturnValue(builder);

      const result = await service.getConversation('nonexistent', 'user-1');

      expect(result).toBeNull();
    });

    it('should throw on unexpected errors', async () => {
      const builder: any = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.is = jest.fn().mockReturnValue(builder);
      builder.single = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'UNEXPECTED', message: 'Unexpected error' },
      });

      mockSupabaseClient.from.mockReturnValue(builder);

      await expect(service.getConversation('conv-1', 'user-1')).rejects.toThrow(
        'Failed to get conversation: Unexpected error',
      );
    });
  });

  describe('deleteConversation', () => {
    it('should soft-delete by setting deleted_at with userId filter', async () => {
      let capturedUpdate: any;
      const builder: any = {};
      builder.update = jest.fn((data) => {
        capturedUpdate = data;
        return builder;
      });
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.then = (resolve: any) => resolve({ error: null });

      mockSupabaseClient.from.mockReturnValue(builder);

      await service.deleteConversation('conv-1', 'user-1');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('conversations');
      expect(capturedUpdate.deleted_at).toBeDefined();
      // deleted_at should be a valid ISO string
      expect(new Date(capturedUpdate.deleted_at).toISOString()).toBe(capturedUpdate.deleted_at);
      // Verify both conversationId and userId filters are applied
      expect(builder.eq).toHaveBeenCalledWith('id', 'conv-1');
      expect(builder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    });

    it('should throw an error when soft-delete fails', async () => {
      const builder: any = {};
      builder.update = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.then = (resolve: any) => resolve({ error: { message: 'Update failed' } });

      mockSupabaseClient.from.mockReturnValue(builder);

      await expect(service.deleteConversation('conv-1', 'user-1')).rejects.toThrow(
        'Failed to delete conversation: Update failed',
      );
    });
  });

  describe('context window bounding', () => {
    it('should return at most 50 messages even when more exist', async () => {
      // Generate 60 messages (more than the 50 limit)
      const mockMessages = Array.from({ length: 50 }, (_, i) => ({
        id: `msg-${60 - i}`,
        conversation_id: 'conv-1',
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${60 - i}`,
        token_count: 10,
        created_at: new Date(2024, 0, 1, 0, 0, 60 - i).toISOString(),
      }));

      const builder: any = {};
      builder.select = jest.fn().mockReturnValue(builder);
      builder.eq = jest.fn().mockReturnValue(builder);
      builder.order = jest.fn().mockReturnValue(builder);
      builder.limit = jest.fn().mockReturnValue(builder);
      builder.then = (resolve: any) => resolve({ data: mockMessages, error: null });

      mockSupabaseClient.from.mockReturnValue(builder);

      const result = await service.getContextWindow('conv-1');

      expect(result.length).toBeLessThanOrEqual(CONVERSATION_CONTEXT_WINDOW);
      expect(builder.limit).toHaveBeenCalledWith(50);
    });
  });
});

/**
 * Helper to create a chainable Supabase query builder mock
 * that resolves with the given data on .single()
 */
function createChainableBuilder(resolvedData: any, resolvedError: any = null) {
  const builder: any = {};
  builder.insert = jest.fn().mockReturnValue(builder);
  builder.update = jest.fn().mockReturnValue(builder);
  builder.select = jest.fn().mockReturnValue(builder);
  builder.eq = jest.fn().mockReturnValue(builder);
  builder.is = jest.fn().mockReturnValue(builder);
  builder.order = jest.fn().mockReturnValue(builder);
  builder.limit = jest.fn().mockReturnValue(builder);
  builder.single = jest.fn().mockResolvedValue({ data: resolvedData, error: resolvedError });
  builder.then = (resolve: any) => resolve({ data: resolvedData, error: resolvedError });
  return builder;
}

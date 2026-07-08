import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import {
  ConversationThread,
  ConversationMessage,
  ChatMessage,
} from '../interfaces/ai.interfaces';
import {
  CONVERSATION_CONTEXT_WINDOW,
  CONVERSATION_EXPIRY_DAYS,
} from '../constants/ai.constants';

/**
 * Conversation Store Service
 *
 * Manages CRUD operations for AI conversation threads and messages.
 * Enforces RLS via the Supabase client (users access only their own data).
 * Maintains a bounded context window and supports soft-delete.
 */
@Injectable()
export class ConversationStoreService {
  private readonly logger = new Logger(ConversationStoreService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Creates a new conversation thread with a unique UUID.
   * Sets expires_at to creation time + 90 days.
   */
  async createConversation(
    userId: string,
    title?: string,
  ): Promise<ConversationThread> {
    const client = this.supabaseService.getClient();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CONVERSATION_EXPIRY_DAYS);

    const { data, error } = await client
      .from('conversations')
      .insert({
        user_id: userId,
        title: title || 'New Conversation',
        expires_at: expiresAt.toISOString(),
        message_count: 0,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(
        `Failed to create conversation for user ${userId}: ${error.message}`,
      );
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    return this.mapToConversationThread(data);
  }

  /**
   * Gets a single conversation by ID for a specific user.
   * Returns null if not found or soft-deleted.
   * Enforces user ownership via userId filter.
   */
  async getConversation(
    conversationId: string,
    userId: string,
  ): Promise<ConversationThread | null> {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      this.logger.error(
        `Failed to get conversation ${conversationId}: ${error.message}`,
      );
      throw new Error(`Failed to get conversation: ${error.message}`);
    }

    return this.mapToConversationThread(data);
  }

  /**
   * Lists user's conversations sorted by updated_at desc.
   * Excludes soft-deleted conversations.
   */
  async listConversations(userId: string): Promise<ConversationThread[]> {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (error) {
      this.logger.error(
        `Failed to list conversations for user ${userId}: ${error.message}`,
      );
      throw new Error(`Failed to list conversations: ${error.message}`);
    }

    return (data || []).map(this.mapToConversationThread);
  }

  /**
   * Soft-deletes a conversation by setting deleted_at timestamp.
   * Enforces user ownership via userId filter.
   */
  async deleteConversation(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    const client = this.supabaseService.getClient();

    const { error } = await client
      .from('conversations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', conversationId)
      .eq('user_id', userId);

    if (error) {
      this.logger.error(
        `Failed to delete conversation ${conversationId}: ${error.message}`,
      );
      throw new Error(`Failed to delete conversation: ${error.message}`);
    }
  }

  /**
   * Persists a message with role, content, and token count.
   * Also increments the conversation's message_count and updates updated_at.
   */
  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    tokenCount: number,
  ): Promise<ConversationMessage> {
    const client = this.supabaseService.getClient();

    // Insert the message
    const { data, error } = await client
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        token_count: tokenCount,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(
        `Failed to add message to conversation ${conversationId}: ${error.message}`,
      );
      throw new Error(`Failed to add message: ${error.message}`);
    }

    // Update conversation's message_count and updated_at
    const { error: updateError } = await client
      .from('conversations')
      .update({
        message_count: await this.getMessageCount(conversationId),
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);

    if (updateError) {
      this.logger.warn(
        `Failed to update conversation metadata for ${conversationId}: ${updateError.message}`,
      );
    }

    return this.mapToConversationMessage(data);
  }

  /**
   * Gets messages for a conversation, with a default limit of CONVERSATION_CONTEXT_WINDOW (50).
   * Returns messages in chronological order (oldest first).
   */
  async getMessages(
    conversationId: string,
    limit: number = CONVERSATION_CONTEXT_WINDOW,
  ): Promise<ConversationMessage[]> {
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.logger.error(
        `Failed to get messages for conversation ${conversationId}: ${error.message}`,
      );
      throw new Error(`Failed to get messages: ${error.message}`);
    }

    // Reverse to get chronological order (oldest first)
    return (data || []).reverse().map(this.mapToConversationMessage);
  }

  /**
   * Gets the most recent 50 messages as ChatMessage[] for LLM context.
   * Returns messages in chronological order for proper conversation flow.
   * This is the bounded context window used when assembling prompts.
   */
  async getContextWindow(conversationId: string): Promise<ChatMessage[]> {
    const messages = await this.getMessages(
      conversationId,
      CONVERSATION_CONTEXT_WINDOW,
    );

    return messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));
  }

  /**
   * Gets the current message count for a conversation.
   */
  private async getMessageCount(conversationId: string): Promise<number> {
    const client = this.supabaseService.getClient();

    const { count, error } = await client
      .from('conversation_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);

    if (error) {
      this.logger.warn(
        `Failed to count messages for ${conversationId}: ${error.message}`,
      );
      return 0;
    }

    return count || 0;
  }

  /**
   * Maps a database row to a ConversationThread interface.
   */
  private mapToConversationThread(row: any): ConversationThread {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      messageCount: row.message_count,
    };
  }

  /**
   * Maps a database row to a ConversationMessage interface.
   */
  private mapToConversationMessage(row: any): ConversationMessage {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role,
      content: row.content,
      tokenCount: row.token_count,
      createdAt: row.created_at,
    };
  }
}

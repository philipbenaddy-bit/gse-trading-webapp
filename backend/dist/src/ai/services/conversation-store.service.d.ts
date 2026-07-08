import { SupabaseService } from '../../supabase/supabase.service';
import { ConversationThread, ConversationMessage, ChatMessage } from '../interfaces/ai.interfaces';
export declare class ConversationStoreService {
    private readonly supabaseService;
    private readonly logger;
    constructor(supabaseService: SupabaseService);
    createConversation(userId: string, title?: string): Promise<ConversationThread>;
    getConversation(conversationId: string, userId: string): Promise<ConversationThread | null>;
    listConversations(userId: string): Promise<ConversationThread[]>;
    deleteConversation(conversationId: string, userId: string): Promise<void>;
    addMessage(conversationId: string, role: 'user' | 'assistant', content: string, tokenCount: number): Promise<ConversationMessage>;
    getMessages(conversationId: string, limit?: number): Promise<ConversationMessage[]>;
    getContextWindow(conversationId: string): Promise<ChatMessage[]>;
    private getMessageCount;
    private mapToConversationThread;
    private mapToConversationMessage;
}

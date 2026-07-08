"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ConversationStoreService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationStoreService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../supabase/supabase.service");
const ai_constants_1 = require("../constants/ai.constants");
let ConversationStoreService = ConversationStoreService_1 = class ConversationStoreService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
        this.logger = new common_1.Logger(ConversationStoreService_1.name);
    }
    async createConversation(userId, title) {
        const client = this.supabaseService.getClient();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + ai_constants_1.CONVERSATION_EXPIRY_DAYS);
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
            this.logger.error(`Failed to create conversation for user ${userId}: ${error.message}`);
            throw new Error(`Failed to create conversation: ${error.message}`);
        }
        return this.mapToConversationThread(data);
    }
    async getConversation(conversationId, userId) {
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
                return null;
            }
            this.logger.error(`Failed to get conversation ${conversationId}: ${error.message}`);
            throw new Error(`Failed to get conversation: ${error.message}`);
        }
        return this.mapToConversationThread(data);
    }
    async listConversations(userId) {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
            .from('conversations')
            .select('*')
            .eq('user_id', userId)
            .is('deleted_at', null)
            .order('updated_at', { ascending: false });
        if (error) {
            this.logger.error(`Failed to list conversations for user ${userId}: ${error.message}`);
            throw new Error(`Failed to list conversations: ${error.message}`);
        }
        return (data || []).map(this.mapToConversationThread);
    }
    async deleteConversation(conversationId, userId) {
        const client = this.supabaseService.getClient();
        const { error } = await client
            .from('conversations')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', conversationId)
            .eq('user_id', userId);
        if (error) {
            this.logger.error(`Failed to delete conversation ${conversationId}: ${error.message}`);
            throw new Error(`Failed to delete conversation: ${error.message}`);
        }
    }
    async addMessage(conversationId, role, content, tokenCount) {
        const client = this.supabaseService.getClient();
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
            this.logger.error(`Failed to add message to conversation ${conversationId}: ${error.message}`);
            throw new Error(`Failed to add message: ${error.message}`);
        }
        const { error: updateError } = await client
            .from('conversations')
            .update({
            message_count: await this.getMessageCount(conversationId),
            updated_at: new Date().toISOString(),
        })
            .eq('id', conversationId);
        if (updateError) {
            this.logger.warn(`Failed to update conversation metadata for ${conversationId}: ${updateError.message}`);
        }
        return this.mapToConversationMessage(data);
    }
    async getMessages(conversationId, limit = ai_constants_1.CONVERSATION_CONTEXT_WINDOW) {
        const client = this.supabaseService.getClient();
        const { data, error } = await client
            .from('conversation_messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) {
            this.logger.error(`Failed to get messages for conversation ${conversationId}: ${error.message}`);
            throw new Error(`Failed to get messages: ${error.message}`);
        }
        return (data || []).reverse().map(this.mapToConversationMessage);
    }
    async getContextWindow(conversationId) {
        const messages = await this.getMessages(conversationId, ai_constants_1.CONVERSATION_CONTEXT_WINDOW);
        return messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
        }));
    }
    async getMessageCount(conversationId) {
        const client = this.supabaseService.getClient();
        const { count, error } = await client
            .from('conversation_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversationId);
        if (error) {
            this.logger.warn(`Failed to count messages for ${conversationId}: ${error.message}`);
            return 0;
        }
        return count || 0;
    }
    mapToConversationThread(row) {
        return {
            id: row.id,
            userId: row.user_id,
            title: row.title,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            messageCount: row.message_count,
        };
    }
    mapToConversationMessage(row) {
        return {
            id: row.id,
            conversationId: row.conversation_id,
            role: row.role,
            content: row.content,
            tokenCount: row.token_count,
            createdAt: row.created_at,
        };
    }
};
exports.ConversationStoreService = ConversationStoreService;
exports.ConversationStoreService = ConversationStoreService = ConversationStoreService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], ConversationStoreService);
//# sourceMappingURL=conversation-store.service.js.map
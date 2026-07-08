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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let NewsService = class NewsService {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async createNews(createNewsDto, authorId) {
        const { data, error } = await this.supabase.getClient()
            .from('news')
            .insert({
            title: createNewsDto.title,
            content: createNewsDto.content,
            summary: createNewsDto.summary,
            source: createNewsDto.source,
            source_url: createNewsDto.sourceUrl,
            image_url: createNewsDto.imageUrl,
            related_symbols: createNewsDto.relatedSymbols,
            category: createNewsDto.category,
            author_id: authorId,
        })
            .select('*')
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        return data;
    }
    async getAllNews(params) {
        const { category, symbol, limit = 20, offset = 0 } = params;
        let query = this.supabase.getClient()
            .from('news')
            .select(`
        *,
        author:users!author_id(id, first_name, last_name, email)
      `)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (category) {
            query = query.eq('category', category);
        }
        if (symbol) {
            query = query.contains('related_symbols', [symbol]);
        }
        const { data, error, count } = await query;
        if (error)
            throw new common_1.BadRequestException(error.message);
        return {
            data,
            total: count,
            limit,
            offset,
        };
    }
    async getNewsById(id) {
        const { data, error } = await this.supabase.getClient()
            .from('news')
            .select(`
        *,
        author:users!author_id(id, first_name, last_name, email)
      `)
            .eq('id', id)
            .single();
        if (error || !data)
            throw new common_1.NotFoundException('News not found');
        await this.supabase.getClient()
            .from('news')
            .update({ view_count: data.view_count + 1 })
            .eq('id', id);
        return data;
    }
    async deleteNews(id, userId) {
        const { data: news } = await this.supabase.getClient()
            .from('news')
            .select('author_id')
            .eq('id', id)
            .single();
        if (!news)
            throw new common_1.NotFoundException('News not found');
        if (news.author_id !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own news');
        }
        const { error } = await this.supabase.getClient()
            .from('news')
            .delete()
            .eq('id', id);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return { message: 'News deleted successfully' };
    }
    async createComment(newsId, userId, createCommentDto) {
        const { data: news } = await this.supabase.getClient()
            .from('news')
            .select('id')
            .eq('id', newsId)
            .single();
        if (!news)
            throw new common_1.NotFoundException('News not found');
        if (createCommentDto.parentId) {
            const { data: parent } = await this.supabase.getClient()
                .from('comments')
                .select('id')
                .eq('id', createCommentDto.parentId)
                .single();
            if (!parent)
                throw new common_1.NotFoundException('Parent comment not found');
        }
        const { data, error } = await this.supabase.getClient()
            .from('comments')
            .insert({
            news_id: newsId,
            user_id: userId,
            content: createCommentDto.content,
            parent_id: createCommentDto.parentId,
        })
            .select(`
        *,
        user:users!user_id(id, first_name, last_name, email)
      `)
            .single();
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.supabase.getClient()
            .rpc('increment_news_comment_count', { news_id: newsId });
        if (createCommentDto.parentId) {
            await this.supabase.getClient()
                .rpc('increment_comment_reply_count', { comment_id: createCommentDto.parentId });
        }
        return data;
    }
    async getComments(newsId, params) {
        const { limit = 20, offset = 0 } = params;
        const { data, error } = await this.supabase.getClient()
            .from('comments')
            .select(`
        *,
        user:users!user_id(id, first_name, last_name, email)
      `)
            .eq('news_id', newsId)
            .is('parent_id', null)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return data;
    }
    async getReplies(commentId) {
        const { data, error } = await this.supabase.getClient()
            .from('comments')
            .select(`
        *,
        user:users!user_id(id, first_name, last_name, email)
      `)
            .eq('parent_id', commentId)
            .order('created_at', { ascending: true });
        if (error)
            throw new common_1.BadRequestException(error.message);
        return data;
    }
    async deleteComment(commentId, userId) {
        const { data: comment } = await this.supabase.getClient()
            .from('comments')
            .select('user_id, news_id, parent_id')
            .eq('id', commentId)
            .single();
        if (!comment)
            throw new common_1.NotFoundException('Comment not found');
        if (comment.user_id !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own comments');
        }
        const { error } = await this.supabase.getClient()
            .from('comments')
            .delete()
            .eq('id', commentId);
        if (error)
            throw new common_1.BadRequestException(error.message);
        await this.supabase.getClient()
            .rpc('decrement_news_comment_count', { news_id: comment.news_id });
        if (comment.parent_id) {
            await this.supabase.getClient()
                .rpc('decrement_comment_reply_count', { comment_id: comment.parent_id });
        }
        return { message: 'Comment deleted successfully' };
    }
    async toggleReaction(newsId, userId, createReactionDto) {
        const { data: existing } = await this.supabase.getClient()
            .from('reactions')
            .select('id, type')
            .eq('news_id', newsId)
            .eq('user_id', userId)
            .single();
        if (existing) {
            if (existing.type === createReactionDto.type) {
                await this.supabase.getClient()
                    .from('reactions')
                    .delete()
                    .eq('id', existing.id);
                await this.supabase.getClient()
                    .rpc('decrement_news_reaction_count', { news_id: newsId });
                return { action: 'removed', type: createReactionDto.type };
            }
            else {
                await this.supabase.getClient()
                    .from('reactions')
                    .update({ type: createReactionDto.type })
                    .eq('id', existing.id);
                return { action: 'updated', type: createReactionDto.type };
            }
        }
        else {
            await this.supabase.getClient()
                .from('reactions')
                .insert({
                news_id: newsId,
                user_id: userId,
                type: createReactionDto.type,
            });
            await this.supabase.getClient()
                .rpc('increment_news_reaction_count', { news_id: newsId });
            return { action: 'added', type: createReactionDto.type };
        }
    }
    async getReactionsByNews(newsId) {
        const { data, error } = await this.supabase.getClient()
            .from('reactions')
            .select('type, user_id')
            .eq('news_id', newsId);
        if (error)
            throw new common_1.BadRequestException(error.message);
        const grouped = data.reduce((acc, reaction) => {
            if (!acc[reaction.type]) {
                acc[reaction.type] = { type: reaction.type, count: 0, users: [] };
            }
            acc[reaction.type].count++;
            acc[reaction.type].users.push(reaction.user_id);
            return acc;
        }, {});
        return Object.values(grouped);
    }
    async getUserReaction(newsId, userId) {
        const { data, error } = await this.supabase.getClient()
            .from('reactions')
            .select('type')
            .eq('news_id', newsId)
            .eq('user_id', userId)
            .single();
        if (error)
            return null;
        return data;
    }
    async getTrendingNews(limit = 10) {
        const { data, error } = await this.supabase.getClient()
            .from('news')
            .select(`
        *,
        author:users!author_id(id, first_name, last_name, email)
      `)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .order('view_count', { ascending: false })
            .order('reaction_count', { ascending: false })
            .limit(limit);
        if (error)
            throw new common_1.BadRequestException(error.message);
        return data;
    }
};
exports.NewsService = NewsService;
exports.NewsService = NewsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], NewsService);
//# sourceMappingURL=news.service.js.map
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReactionDto } from './dto/create-reaction.dto';

@Injectable()
export class NewsService {
  constructor(private supabase: SupabaseService) {}

  // ==================== NEWS ====================

  async createNews(createNewsDto: CreateNewsDto, authorId?: string) {
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

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getAllNews(params: {
    category?: string;
    symbol?: string;
    limit?: number;
    offset?: number;
  }) {
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

    if (error) throw new BadRequestException(error.message);

    return {
      data,
      total: count,
      limit,
      offset,
    };
  }

  async getNewsById(id: string) {
    const { data, error } = await this.supabase.getClient()
      .from('news')
      .select(`
        *,
        author:users!author_id(id, first_name, last_name, email)
      `)
      .eq('id', id)
      .single();

    if (error || !data) throw new NotFoundException('News not found');

    // Increment view count
    await this.supabase.getClient()
      .from('news')
      .update({ view_count: data.view_count + 1 })
      .eq('id', id);

    return data;
  }

  async deleteNews(id: string, userId: string) {
    // Check if user is the author
    const { data: news } = await this.supabase.getClient()
      .from('news')
      .select('author_id')
      .eq('id', id)
      .single();

    if (!news) throw new NotFoundException('News not found');
    if (news.author_id !== userId) {
      throw new ForbiddenException('You can only delete your own news');
    }

    const { error } = await this.supabase.getClient()
      .from('news')
      .delete()
      .eq('id', id);

    if (error) throw new BadRequestException(error.message);

    return { message: 'News deleted successfully' };
  }

  // ==================== COMMENTS ====================

  async createComment(newsId: string, userId: string, createCommentDto: CreateCommentDto) {
    // Verify news exists
    const { data: news } = await this.supabase.getClient()
      .from('news')
      .select('id')
      .eq('id', newsId)
      .single();

    if (!news) throw new NotFoundException('News not found');

    // If replying to a comment, verify parent exists
    if (createCommentDto.parentId) {
      const { data: parent } = await this.supabase.getClient()
        .from('comments')
        .select('id')
        .eq('id', createCommentDto.parentId)
        .single();

      if (!parent) throw new NotFoundException('Parent comment not found');
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

    if (error) throw new BadRequestException(error.message);

    // Update comment count on news
    await this.supabase.getClient()
      .rpc('increment_news_comment_count', { news_id: newsId });

    // If reply, update reply count on parent comment
    if (createCommentDto.parentId) {
      await this.supabase.getClient()
        .rpc('increment_comment_reply_count', { comment_id: createCommentDto.parentId });
    }

    return data;
  }

  async getComments(newsId: string, params: { limit?: number; offset?: number }) {
    const { limit = 20, offset = 0 } = params;

    const { data, error } = await this.supabase.getClient()
      .from('comments')
      .select(`
        *,
        user:users!user_id(id, first_name, last_name, email)
      `)
      .eq('news_id', newsId)
      .is('parent_id', null) // Only top-level comments
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async getReplies(commentId: string) {
    const { data, error } = await this.supabase.getClient()
      .from('comments')
      .select(`
        *,
        user:users!user_id(id, first_name, last_name, email)
      `)
      .eq('parent_id', commentId)
      .order('created_at', { ascending: true });

    if (error) throw new BadRequestException(error.message);

    return data;
  }

  async deleteComment(commentId: string, userId: string) {
    // Check if user is the comment author
    const { data: comment } = await this.supabase.getClient()
      .from('comments')
      .select('user_id, news_id, parent_id')
      .eq('id', commentId)
      .single();

    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    const { error } = await this.supabase.getClient()
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) throw new BadRequestException(error.message);

    // Update comment count on news
    await this.supabase.getClient()
      .rpc('decrement_news_comment_count', { news_id: comment.news_id });

    // If reply, update reply count on parent comment
    if (comment.parent_id) {
      await this.supabase.getClient()
        .rpc('decrement_comment_reply_count', { comment_id: comment.parent_id });
    }

    return { message: 'Comment deleted successfully' };
  }

  // ==================== REACTIONS ====================

  async toggleReaction(newsId: string, userId: string, createReactionDto: CreateReactionDto) {
    // Check if reaction already exists
    const { data: existing } = await this.supabase.getClient()
      .from('reactions')
      .select('id, type')
      .eq('news_id', newsId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      // If same type, remove reaction
      if (existing.type === createReactionDto.type) {
        await this.supabase.getClient()
          .from('reactions')
          .delete()
          .eq('id', existing.id);

        await this.supabase.getClient()
          .rpc('decrement_news_reaction_count', { news_id: newsId });

        return { action: 'removed', type: createReactionDto.type };
      } else {
        // Update to new type
        await this.supabase.getClient()
          .from('reactions')
          .update({ type: createReactionDto.type })
          .eq('id', existing.id);

        return { action: 'updated', type: createReactionDto.type };
      }
    } else {
      // Create new reaction
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

  async getReactionsByNews(newsId: string) {
    const { data, error } = await this.supabase.getClient()
      .from('reactions')
      .select('type, user_id')
      .eq('news_id', newsId);

    if (error) throw new BadRequestException(error.message);

    // Group by type and count
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

  async getUserReaction(newsId: string, userId: string) {
    const { data, error } = await this.supabase.getClient()
      .from('reactions')
      .select('type')
      .eq('news_id', newsId)
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return data;
  }

  // ==================== TRENDING ====================

  async getTrendingNews(limit: number = 10) {
    const { data, error } = await this.supabase.getClient()
      .from('news')
      .select(`
        *,
        author:users!author_id(id, first_name, last_name, email)
      `)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
      .order('view_count', { ascending: false })
      .order('reaction_count', { ascending: false })
      .limit(limit);

    if (error) throw new BadRequestException(error.message);

    return data;
  }
}

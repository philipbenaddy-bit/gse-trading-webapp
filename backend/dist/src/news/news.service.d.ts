import { SupabaseService } from '../supabase/supabase.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReactionDto } from './dto/create-reaction.dto';
export declare class NewsService {
    private supabase;
    constructor(supabase: SupabaseService);
    createNews(createNewsDto: CreateNewsDto, authorId?: string): Promise<any>;
    getAllNews(params: {
        category?: string;
        symbol?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        data: any[];
        total: number;
        limit: number;
        offset: number;
    }>;
    getNewsById(id: string): Promise<any>;
    deleteNews(id: string, userId: string): Promise<{
        message: string;
    }>;
    createComment(newsId: string, userId: string, createCommentDto: CreateCommentDto): Promise<any>;
    getComments(newsId: string, params: {
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
    getReplies(commentId: string): Promise<any[]>;
    deleteComment(commentId: string, userId: string): Promise<{
        message: string;
    }>;
    toggleReaction(newsId: string, userId: string, createReactionDto: CreateReactionDto): Promise<{
        action: string;
        type: string;
    }>;
    getReactionsByNews(newsId: string): Promise<unknown[]>;
    getUserReaction(newsId: string, userId: string): Promise<{
        type: any;
    }>;
    getTrendingNews(limit?: number): Promise<any[]>;
}

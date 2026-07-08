import { NewsService } from './news.service';
import { NewsAggregatorService } from './news-aggregator.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReactionDto } from './dto/create-reaction.dto';
export declare class NewsController {
    private readonly newsService;
    private readonly newsAggregator;
    constructor(newsService: NewsService, newsAggregator: NewsAggregatorService);
    createNews(createNewsDto: CreateNewsDto, req: any): Promise<any>;
    getAllNews(category?: string, symbol?: string, limit?: number, offset?: number): Promise<{
        data: import("./news-aggregator.service").NewsArticle[];
        total: number;
    }>;
    getTrendingNews(limit?: number): Promise<import("./news-aggregator.service").NewsArticle[]>;
    getNewsById(id: string): Promise<any>;
    deleteNews(id: string, req: any): Promise<{
        message: string;
    }>;
    createComment(newsId: string, createCommentDto: CreateCommentDto, req: any): Promise<any>;
    getComments(newsId: string, limit?: number, offset?: number): Promise<any[]>;
    getReplies(commentId: string): Promise<any[]>;
    deleteComment(commentId: string, req: any): Promise<{
        message: string;
    }>;
    toggleReaction(newsId: string, createReactionDto: CreateReactionDto, req: any): Promise<{
        action: string;
        type: string;
    }>;
    getReactions(newsId: string): Promise<unknown[]>;
    getUserReaction(newsId: string, req: any): Promise<{
        type: any;
    }>;
}

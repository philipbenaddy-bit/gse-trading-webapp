export interface NewsArticle {
    id: string;
    title: string;
    content: string;
    summary: string;
    source: string;
    sourceUrl: string;
    imageUrl?: string;
    relatedSymbols?: string[];
    category: string;
    viewCount: number;
    commentCount: number;
    reactionCount: number;
    createdAt: string;
    updatedAt: string;
}
export declare class NewsAggregatorService {
    private readonly logger;
    private newsCache;
    private lastFetch;
    private readonly CACHE_DURATION;
    constructor();
    getAllNews(params: {
        category?: string;
        symbol?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        data: NewsArticle[];
        total: number;
    }>;
    getTrendingNews(limit?: number): Promise<NewsArticle[]>;
    private fetchAndCacheNews;
    private generateSampleGhanaFinanceNews;
    private generateTitle;
    private generateContent;
    private generateSummary;
}

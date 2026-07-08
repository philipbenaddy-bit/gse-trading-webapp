import { SupabaseService } from '../../supabase/supabase.service';
import { GseService } from '../../gse/gse.service';
import { NewsAggregatorService } from '../../news/news-aggregator.service';
import { AiService } from '../ai.service';
import { DisclaimerEngineService } from './disclaimer-engine.service';
import { InsightCard } from '../interfaces/ai.interfaces';
export declare class InsightGeneratorService {
    private readonly supabaseService;
    private readonly gseService;
    private readonly newsAggregatorService;
    private readonly aiService;
    private readonly disclaimerEngine;
    private readonly logger;
    constructor(supabaseService: SupabaseService, gseService: GseService, newsAggregatorService: NewsAggregatorService, aiService: AiService, disclaimerEngine: DisclaimerEngineService);
    getInsights(userId: string, holdings: any[]): Promise<InsightCard[] | null>;
    generateInsights(userId: string, holdings: any[], news: any[]): Promise<InsightCard[]>;
    getCachedInsights(userId: string): Promise<InsightCard[] | null>;
    cacheInsights(userId: string, insights: InsightCard[]): Promise<void>;
    shouldRefresh(userId: string): Promise<boolean>;
    private getRelevantNews;
    private parseInsightsResponse;
    private generateFallbackInsights;
    private truncate;
}

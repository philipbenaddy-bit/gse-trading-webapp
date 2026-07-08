import { GseService } from '../../gse/gse.service';
import { PortfolioService } from '../../portfolio/portfolio.service';
import { NewsAggregatorService } from '../../news/news-aggregator.service';
import { MarketDataContext, NewsDataContext, PortfolioDataContext } from '../interfaces/ai.interfaces';
export declare const GSE_SYMBOL_MAP: Record<string, string[]>;
export declare class ContextBuilderService {
    private readonly gseService;
    private readonly portfolioService;
    private readonly newsAggregatorService;
    private readonly logger;
    constructor(gseService: GseService, portfolioService: PortfolioService, newsAggregatorService: NewsAggregatorService);
    buildMarketContext(message: string): Promise<MarketDataContext | undefined>;
    buildPortfolioContext(userId: string, isKycVerified: boolean): Promise<PortfolioDataContext | undefined>;
    buildNewsContext(symbols: string[], isSentimentQuery: boolean): Promise<NewsDataContext | undefined>;
    private fetchNewsArticles;
    private truncateSummary;
    private deduplicateArticles;
    extractStockSymbols(message: string): string[];
    private matchesWordBoundary;
    private calculateCompositeIndex;
    private getTopGainersAndLosers;
}

import { GseService } from '../gse/gse.service';
import { SupabaseService } from '../supabase/supabase.service';
export declare class AnalyticsService {
    private gseService;
    private supabase;
    constructor(gseService: GseService, supabase: SupabaseService);
    getMarketMetrics(): {
        summary: {
            totalStocks: number;
            gainers: number;
            losers: number;
            unchanged: number;
            totalVolume: number;
            avgChange: number;
            marketSentiment: string;
        };
        topGainers: any[];
        topLosers: any[];
        mostActive: any[];
    };
    getSectorAllocation(): {
        sector: string;
        stockCount: number;
        marketCap: number;
        allocation: number;
        stocks: string[];
    }[];
    getPortfolioPerformance(userId: string, timeframe: string): Promise<{
        dataPoints: {
            date: string;
            portfolioValue: number;
            invested: number;
        }[];
        summary: {
            totalReturn: number;
            totalReturnPercent: number;
        };
    }>;
    getTradingStats(userId: string): Promise<{
        totalOrders: number;
        filledOrders: number;
        cancelledOrders: number;
        buyOrders: number;
        sellOrders: number;
        winRate: number;
        avgHoldDays: number;
        topSymbols: any[];
        activityByMonth: any[];
    }>;
    getExportData(userId: string, type: 'portfolio' | 'orders' | 'transactions'): Promise<any[]>;
    private emptyMarketMetrics;
    private emptyTradingStats;
}

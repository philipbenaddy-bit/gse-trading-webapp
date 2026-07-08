import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private analyticsService;
    constructor(analyticsService: AnalyticsService);
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
    getPerformance(req: any, timeframe?: string): Promise<{
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
    getTradingStats(req: any): Promise<{
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
    exportData(req: any, type: 'portfolio' | 'orders' | 'transactions', res: Response): Promise<Response<any, Record<string, any>>>;
}

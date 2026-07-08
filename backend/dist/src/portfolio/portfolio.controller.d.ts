import { PortfolioService } from './portfolio.service';
export declare class PortfolioController {
    private portfolioService;
    constructor(portfolioService: PortfolioService);
    getPortfolio(req: any): Promise<{
        holdings: {
            id: any;
            userId: any;
            symbol: any;
            quantity: any;
            averageCost: any;
            totalCost: any;
            currentPrice: number;
            currentValue: number;
            pnl: number;
            pnlPercent: number;
            change: number;
            createdAt: any;
            updatedAt: any;
        }[];
        summary: {
            totalValue: number;
            totalCost: number;
            totalPnl: number;
            totalPnlPercent: number;
        };
    }>;
}

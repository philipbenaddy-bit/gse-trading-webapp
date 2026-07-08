import { SupabaseService } from '../supabase/supabase.service';
import { GseService } from '../gse/gse.service';
export declare class PortfolioService {
    private supabase;
    private gseService;
    constructor(supabase: SupabaseService, gseService: GseService);
    getUserPortfolio(userId: string): Promise<{
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

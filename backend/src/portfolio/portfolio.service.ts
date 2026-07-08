import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { GseService } from '../gse/gse.service';

@Injectable()
export class PortfolioService {
  constructor(
    private supabase: SupabaseService,
    private gseService: GseService,
  ) {}

  async getUserPortfolio(userId: string) {
    // Use admin client to bypass RLS for server-side operations
    const client = this.supabase.getAdminClient();
    
    const { data: holdings, error } = await client
      .from('portfolio')
      .select('*')
      .eq('user_id', userId);

    if (error) throw new Error(error.message);

    // Enrich with current prices
    const enriched = holdings.map((holding) => {
      const live = this.gseService.getLiveBySymbol(holding.symbol);
      const currentPrice = live?.price || 0;
      const currentValue = currentPrice * holding.quantity;
      const totalCost = Number(holding.total_cost);
      const pnl = currentValue - totalCost;
      const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;

      return {
        id: holding.id,
        userId: holding.user_id,
        symbol: holding.symbol,
        quantity: holding.quantity,
        averageCost: holding.average_cost,
        totalCost: holding.total_cost,
        currentPrice,
        currentValue,
        pnl,
        pnlPercent: parseFloat(pnlPercent.toFixed(2)),
        change: live?.change || 0,
        createdAt: holding.created_at,
        updatedAt: holding.updated_at,
      };
    });

    const totalValue = enriched.reduce((sum, h) => sum + h.currentValue, 0);
    const totalCost = enriched.reduce((sum, h) => sum + Number(h.totalCost), 0);
    const totalPnl = totalValue - totalCost;
    const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    return {
      holdings: enriched,
      summary: {
        totalValue,
        totalCost,
        totalPnl,
        totalPnlPercent: parseFloat(totalPnlPercent.toFixed(2)),
      },
    };
  }
}

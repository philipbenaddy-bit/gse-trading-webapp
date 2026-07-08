"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const gse_service_1 = require("../gse/gse.service");
let PortfolioService = class PortfolioService {
    constructor(supabase, gseService) {
        this.supabase = supabase;
        this.gseService = gseService;
    }
    async getUserPortfolio(userId) {
        const client = this.supabase.getAdminClient();
        const { data: holdings, error } = await client
            .from('portfolio')
            .select('*')
            .eq('user_id', userId);
        if (error)
            throw new Error(error.message);
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
};
exports.PortfolioService = PortfolioService;
exports.PortfolioService = PortfolioService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        gse_service_1.GseService])
], PortfolioService);
//# sourceMappingURL=portfolio.service.js.map
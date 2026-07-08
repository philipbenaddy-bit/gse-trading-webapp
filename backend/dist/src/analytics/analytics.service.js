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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const gse_service_1 = require("../gse/gse.service");
const supabase_service_1 = require("../supabase/supabase.service");
let AnalyticsService = class AnalyticsService {
    constructor(gseService, supabase) {
        this.gseService = gseService;
        this.supabase = supabase;
    }
    getMarketMetrics() {
        const stocks = this.gseService.getAllLive();
        if (!stocks.length)
            return this.emptyMarketMetrics();
        const gainers = stocks.filter((s) => s.change > 0);
        const losers = stocks.filter((s) => s.change < 0);
        const unchanged = stocks.filter((s) => s.change === 0);
        const totalVolume = stocks.reduce((sum, s) => sum + (s.volume || 0), 0);
        const avgChange = stocks.reduce((sum, s) => sum + s.change, 0) / stocks.length;
        const topGainers = [...gainers]
            .sort((a, b) => b.change - a.change)
            .slice(0, 5)
            .map((s) => ({
            symbol: s.name,
            price: s.price,
            change: s.change,
            changePercent: s.price > 0 ? (s.change / (s.price - s.change)) * 100 : 0,
            volume: s.volume,
        }));
        const topLosers = [...losers]
            .sort((a, b) => a.change - b.change)
            .slice(0, 5)
            .map((s) => ({
            symbol: s.name,
            price: s.price,
            change: s.change,
            changePercent: s.price > 0 ? (s.change / (s.price - s.change)) * 100 : 0,
            volume: s.volume,
        }));
        const mostActive = [...stocks]
            .sort((a, b) => (b.volume || 0) - (a.volume || 0))
            .slice(0, 5)
            .map((s) => ({
            symbol: s.name,
            price: s.price,
            change: s.change,
            volume: s.volume,
        }));
        return {
            summary: {
                totalStocks: stocks.length,
                gainers: gainers.length,
                losers: losers.length,
                unchanged: unchanged.length,
                totalVolume,
                avgChange: parseFloat(avgChange.toFixed(4)),
                marketSentiment: gainers.length > losers.length
                    ? 'bullish'
                    : gainers.length < losers.length
                        ? 'bearish'
                        : 'neutral',
            },
            topGainers,
            topLosers,
            mostActive,
        };
    }
    getSectorAllocation() {
        const equities = this.gseService.getAllEquities();
        const live = this.gseService.getAllLive();
        const liveMap = new Map(live.map((s) => [s.name.toUpperCase(), s]));
        const sectorMap = {};
        equities.forEach((eq) => {
            const sector = eq.company?.sector || eq.company?.industry || 'Other';
            const liveData = liveMap.get(eq.name.toUpperCase());
            const price = liveData?.price || eq.price || 0;
            const shares = eq.shares || 0;
            const marketCap = price * shares;
            if (!sectorMap[sector]) {
                sectorMap[sector] = { count: 0, totalCap: 0, stocks: [] };
            }
            sectorMap[sector].count++;
            sectorMap[sector].totalCap += marketCap;
            sectorMap[sector].stocks.push(eq.name);
        });
        const totalCap = Object.values(sectorMap).reduce((s, v) => s + v.totalCap, 0) || 1;
        return Object.entries(sectorMap)
            .map(([sector, data]) => ({
            sector,
            stockCount: data.count,
            marketCap: data.totalCap,
            allocation: parseFloat(((data.totalCap / totalCap) * 100).toFixed(2)),
            stocks: data.stocks,
        }))
            .sort((a, b) => b.allocation - a.allocation);
    }
    async getPortfolioPerformance(userId, timeframe) {
        const client = this.supabase.getAdminClient();
        const { data: orders } = await client
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'filled')
            .order('created_at', { ascending: true });
        if (!orders?.length) {
            return { dataPoints: [], summary: { totalReturn: 0, totalReturnPercent: 0 } };
        }
        const dataPoints = [];
        let invested = 0;
        let holdings = {};
        const weekMap = {};
        orders.forEach((order) => {
            const week = order.created_at.slice(0, 10);
            if (!weekMap[week])
                weekMap[week] = [];
            weekMap[week].push(order);
        });
        Object.entries(weekMap).forEach(([date, dayOrders]) => {
            dayOrders.forEach((order) => {
                const qty = order.filled_quantity || order.quantity;
                const price = order.filled_price || order.limit_price || 0;
                if (order.side === 'buy') {
                    invested += qty * price;
                    if (!holdings[order.symbol])
                        holdings[order.symbol] = { qty: 0, avgCost: 0 };
                    holdings[order.symbol].qty += qty;
                    holdings[order.symbol].avgCost = price;
                }
                else {
                    invested -= qty * price;
                    if (holdings[order.symbol])
                        holdings[order.symbol].qty -= qty;
                }
            });
            let portfolioValue = 0;
            Object.entries(holdings).forEach(([symbol, h]) => {
                const live = this.gseService.getLiveBySymbol(symbol);
                portfolioValue += h.qty * (live?.price || h.avgCost);
            });
            dataPoints.push({ date, portfolioValue, invested });
        });
        const lastPoint = dataPoints[dataPoints.length - 1];
        const totalReturn = lastPoint ? lastPoint.portfolioValue - lastPoint.invested : 0;
        const totalReturnPercent = lastPoint?.invested > 0 ? (totalReturn / lastPoint.invested) * 100 : 0;
        return {
            dataPoints,
            summary: {
                totalReturn: parseFloat(totalReturn.toFixed(2)),
                totalReturnPercent: parseFloat(totalReturnPercent.toFixed(2)),
            },
        };
    }
    async getTradingStats(userId) {
        const client = this.supabase.getAdminClient();
        const { data: orders } = await client
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (!orders?.length) {
            return this.emptyTradingStats();
        }
        const filled = orders.filter((o) => o.status === 'filled');
        const buys = filled.filter((o) => o.side === 'buy');
        const sells = filled.filter((o) => o.side === 'sell');
        const profitableSells = sells.filter((o) => {
            const buyOrder = buys.find((b) => b.symbol === o.symbol);
            return buyOrder && (o.filled_price || 0) > (buyOrder.filled_price || 0);
        });
        const winRate = sells.length > 0 ? (profitableSells.length / sells.length) * 100 : 0;
        let totalHoldDays = 0;
        let holdCount = 0;
        sells.forEach((sell) => {
            const buy = buys.find((b) => b.symbol === sell.symbol);
            if (buy) {
                const days = (new Date(sell.created_at).getTime() - new Date(buy.created_at).getTime()) /
                    (1000 * 60 * 60 * 24);
                totalHoldDays += days;
                holdCount++;
            }
        });
        const avgHoldDays = holdCount > 0 ? totalHoldDays / holdCount : 0;
        const symbolVolume = {};
        filled.forEach((o) => {
            symbolVolume[o.symbol] = (symbolVolume[o.symbol] || 0) + (o.total_value || 0);
        });
        const topSymbols = Object.entries(symbolVolume)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([symbol, volume]) => ({ symbol, volume }));
        const monthlyActivity = {};
        orders.forEach((o) => {
            const month = o.created_at.slice(0, 7);
            monthlyActivity[month] = (monthlyActivity[month] || 0) + 1;
        });
        const activityByMonth = Object.entries(monthlyActivity)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6)
            .map(([month, count]) => ({ month, count }));
        return {
            totalOrders: orders.length,
            filledOrders: filled.length,
            cancelledOrders: orders.filter((o) => o.status === 'cancelled').length,
            buyOrders: buys.length,
            sellOrders: sells.length,
            winRate: parseFloat(winRate.toFixed(1)),
            avgHoldDays: parseFloat(avgHoldDays.toFixed(1)),
            topSymbols,
            activityByMonth,
        };
    }
    async getExportData(userId, type) {
        const client = this.supabase.getAdminClient();
        if (type === 'portfolio') {
            const { data } = await client
                .from('portfolio')
                .select('*')
                .eq('user_id', userId);
            return data || [];
        }
        if (type === 'orders') {
            const { data } = await client
                .from('orders')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            return data || [];
        }
        if (type === 'transactions') {
            const { data } = await client
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            return data || [];
        }
        return [];
    }
    emptyMarketMetrics() {
        return {
            summary: {
                totalStocks: 0,
                gainers: 0,
                losers: 0,
                unchanged: 0,
                totalVolume: 0,
                avgChange: 0,
                marketSentiment: 'neutral',
            },
            topGainers: [],
            topLosers: [],
            mostActive: [],
        };
    }
    emptyTradingStats() {
        return {
            totalOrders: 0,
            filledOrders: 0,
            cancelledOrders: 0,
            buyOrders: 0,
            sellOrders: 0,
            winRate: 0,
            avgHoldDays: 0,
            topSymbols: [],
            activityByMonth: [],
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gse_service_1.GseService,
        supabase_service_1.SupabaseService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map
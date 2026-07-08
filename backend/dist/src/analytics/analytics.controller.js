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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const analytics_service_1 = require("./analytics.service");
let AnalyticsController = class AnalyticsController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    getMarketMetrics() {
        return this.analyticsService.getMarketMetrics();
    }
    getSectorAllocation() {
        return this.analyticsService.getSectorAllocation();
    }
    async getPerformance(req, timeframe = '1M') {
        return this.analyticsService.getPortfolioPerformance(req.user.id, timeframe);
    }
    async getTradingStats(req) {
        return this.analyticsService.getTradingStats(req.user.id);
    }
    async exportData(req, type = 'orders', res) {
        const data = await this.analyticsService.getExportData(req.user.id, type);
        if (!data.length) {
            return res.json({ data: [], message: 'No data to export' });
        }
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map((row) => Object.values(row)
            .map((v) => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v))
            .join(','));
        const csv = [headers, ...rows].join('\n');
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-export.csv"`);
        return res.send(csv);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Get)('market-metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get live market metrics (gainers, losers, volume)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getMarketMetrics", null);
__decorate([
    (0, common_1.Get)('sectors'),
    (0, swagger_1.ApiOperation)({ summary: 'Get sector allocation from GSE equities' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getSectorAllocation", null);
__decorate([
    (0, common_1.Get)('performance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get portfolio performance over time' }),
    (0, swagger_1.ApiQuery)({ name: 'timeframe', required: false, enum: ['1W', '1M', '3M', '1Y', 'ALL'] }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getPerformance", null);
__decorate([
    (0, common_1.Get)('trading-stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user trading statistics' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getTradingStats", null);
__decorate([
    (0, common_1.Get)('export'),
    (0, swagger_1.ApiOperation)({ summary: 'Export data as JSON (portfolio, orders, transactions)' }),
    (0, swagger_1.ApiQuery)({ name: 'type', enum: ['portfolio', 'orders', 'transactions'] }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "exportData", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('Analytics'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map
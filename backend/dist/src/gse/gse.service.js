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
var GseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const axios_1 = require("axios");
let GseService = GseService_1 = class GseService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(GseService_1.name);
        this.liveCache = new Map();
        this.equitiesCache = new Map();
        this.lastUpdated = null;
        this.baseUrl = config.get('GSE_API_BASE_URL', 'https://dev.kwayisi.org/apis/gse');
    }
    async onModuleInit() {
        await this.refreshLiveData();
        await this.refreshEquitiesData();
    }
    async refreshLiveData() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/live`, {
                timeout: 10000,
            });
            const stocks = response.data;
            stocks.forEach((stock) => {
                this.liveCache.set(stock.name.toUpperCase(), stock);
            });
            this.lastUpdated = new Date();
            this.logger.debug(`Live data refreshed: ${stocks.length} stocks`);
        }
        catch (error) {
            this.logger.error('Failed to refresh GSE live data', error.message);
        }
    }
    async refreshEquitiesData() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/equities`, {
                timeout: 10000,
            });
            const equities = response.data;
            equities.forEach((equity) => {
                this.equitiesCache.set(equity.name.toUpperCase(), equity);
            });
            this.logger.debug(`Equities data refreshed: ${equities.length} stocks`);
        }
        catch (error) {
            this.logger.error('Failed to refresh GSE equities data', error.message);
        }
    }
    getAllLive() {
        return Array.from(this.liveCache.values());
    }
    getLiveBySymbol(symbol) {
        return this.liveCache.get(symbol.toUpperCase()) || null;
    }
    getAllEquities() {
        return Array.from(this.equitiesCache.values());
    }
    getEquityBySymbol(symbol) {
        return this.equitiesCache.get(symbol.toUpperCase()) || null;
    }
    getCurrentPrice(symbol) {
        const live = this.getLiveBySymbol(symbol);
        if (live)
            return live.price;
        const equity = this.getEquityBySymbol(symbol);
        return equity ? equity.price : null;
    }
    getLastUpdated() {
        return this.lastUpdated;
    }
    async fetchEquityDetail(symbol) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/equities/${symbol.toLowerCase()}`, { timeout: 10000 });
            const equity = response.data;
            this.equitiesCache.set(symbol.toUpperCase(), equity);
            return equity;
        }
        catch (error) {
            this.logger.error(`Failed to fetch equity detail for ${symbol}`, error.message);
            return null;
        }
    }
};
exports.GseService = GseService;
__decorate([
    (0, schedule_1.Cron)('*/30 * * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GseService.prototype, "refreshLiveData", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GseService.prototype, "refreshEquitiesData", null);
exports.GseService = GseService = GseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GseService);
//# sourceMappingURL=gse.service.js.map
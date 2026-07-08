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
exports.MarketController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const gse_service_1 = require("../gse/gse.service");
let MarketController = class MarketController {
    constructor(gseService) {
        this.gseService = gseService;
    }
    getLive() {
        return {
            data: this.gseService.getAllLive(),
            lastUpdated: this.gseService.getLastUpdated(),
        };
    }
    getLiveBySymbol(symbol) {
        return this.gseService.getLiveBySymbol(symbol);
    }
    getEquities() {
        return this.gseService.getAllEquities();
    }
    async getEquity(symbol) {
        const cached = this.gseService.getEquityBySymbol(symbol);
        if (cached && cached.company)
            return cached;
        return this.gseService.fetchEquityDetail(symbol);
    }
};
exports.MarketController = MarketController;
__decorate([
    (0, common_1.Get)('live'),
    (0, swagger_1.ApiOperation)({ summary: 'Get live prices for all GSE stocks' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MarketController.prototype, "getLive", null);
__decorate([
    (0, common_1.Get)('live/:symbol'),
    (0, swagger_1.ApiOperation)({ summary: 'Get live price for a specific stock' }),
    __param(0, (0, common_1.Param)('symbol')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MarketController.prototype, "getLiveBySymbol", null);
__decorate([
    (0, common_1.Get)('equities'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all listed equities' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MarketController.prototype, "getEquities", null);
__decorate([
    (0, common_1.Get)('equities/:symbol'),
    (0, swagger_1.ApiOperation)({ summary: 'Get detailed equity info' }),
    __param(0, (0, common_1.Param)('symbol')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MarketController.prototype, "getEquity", null);
exports.MarketController = MarketController = __decorate([
    (0, swagger_1.ApiTags)('Market'),
    (0, common_1.Controller)('market'),
    __metadata("design:paramtypes", [gse_service_1.GseService])
], MarketController);
//# sourceMappingURL=market.controller.js.map
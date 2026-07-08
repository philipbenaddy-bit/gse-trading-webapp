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
var ContextBuilderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextBuilderService = exports.GSE_SYMBOL_MAP = void 0;
const common_1 = require("@nestjs/common");
const gse_service_1 = require("../../gse/gse.service");
const portfolio_service_1 = require("../../portfolio/portfolio.service");
const news_aggregator_service_1 = require("../../news/news-aggregator.service");
const ai_constants_1 = require("../constants/ai.constants");
exports.GSE_SYMBOL_MAP = {
    MTNGH: ['mtn ghana', 'mtn', 'mtngh'],
    GCB: ['gcb bank', 'gcb', 'ghana commercial bank'],
    GOIL: ['goil', 'ghana oil'],
    CAL: ['calbank', 'cal bank', 'cal'],
    EGH: ['ecobank ghana', 'ecobank', 'egh'],
    SCB: ['standard chartered', 'standard chartered bank', 'scb', 'stanchart'],
    TOTAL: ['totalenergies', 'total', 'total energies'],
    FML: ['fan milk', 'fan milk limited', 'fml'],
    BOPP: ['benso oil palm', 'bopp', 'benso'],
    SIC: ['sic insurance', 'sic'],
    SOGEGH: ['societe generale', 'sogegh', 'soge'],
    ETI: ['ecobank transnational', 'eti'],
    DASPHARMA: ['das pharma', 'daspharma'],
    AYRTN: ['ayrton', 'ayrtn', 'ayrton drug'],
    CLYD: ['clydestone', 'clyd'],
    CMLT: ['camelot', 'cmlt'],
    CPC: ['cocoa processing', 'cpc', 'cocoa processing company'],
    DIGICUT: ['digicut', 'digi cut'],
    EGL: ['enterprise group', 'egl', 'enterprise'],
    GLD: ['guinness', 'gld', 'guinness ghana'],
    GWEB: ['golden web', 'gweb'],
    MLC: ['mechanical lloyd', 'mlc', 'mechanical lloyd company'],
    PBC: ['produce buying company', 'pbc'],
    PZC: ['pz cussons', 'pzc', 'pz cussons ghana'],
    RBGH: ['republic bank', 'rbgh', 'republic bank ghana'],
    SWL: ['sam woode', 'swl', 'sam woode limited'],
    TRANSOL: ['transaction solutions', 'transol'],
    UNIL: ['unilever', 'unil', 'unilever ghana'],
    ACCESS: ['access bank', 'access'],
    ADB: ['agricultural development bank', 'adb'],
    ALW: ['aluworks', 'alw'],
    GGBL: ['guinness ghana breweries', 'ggbl'],
    MAC: ['mega african capital', 'mac'],
    MTNGH_ETF: ['mtn ghana etf'],
    NEWGOLD: ['newgold', 'new gold'],
    SPL: ['starlife', 'spl', 'starlife assurance'],
    TLW: ['tullow', 'tlw', 'tullow oil'],
};
let ContextBuilderService = ContextBuilderService_1 = class ContextBuilderService {
    constructor(gseService, portfolioService, newsAggregatorService) {
        this.gseService = gseService;
        this.portfolioService = portfolioService;
        this.newsAggregatorService = newsAggregatorService;
        this.logger = new common_1.Logger(ContextBuilderService_1.name);
    }
    async buildMarketContext(message) {
        try {
            const allLiveStocks = this.gseService.getAllLive();
            if (!allLiveStocks || allLiveStocks.length === 0) {
                this.logger.warn('No market data available in GseService cache');
                return undefined;
            }
            const matchedSymbols = this.extractStockSymbols(message);
            const lastUpdated = this.gseService.getLastUpdated();
            let requestedStock;
            if (matchedSymbols.length > 0) {
                const primarySymbol = matchedSymbols[0];
                const liveData = this.gseService.getLiveBySymbol(primarySymbol);
                if (liveData) {
                    requestedStock = {
                        symbol: primarySymbol,
                        price: liveData.price,
                        changePercent: liveData.change,
                        volume: liveData.volume,
                    };
                }
            }
            const compositeIndex = this.calculateCompositeIndex(allLiveStocks);
            const { topGainers, topLosers } = this.getTopGainersAndLosers(allLiveStocks);
            const lastUpdatedStr = lastUpdated
                ? lastUpdated.toISOString()
                : new Date(0).toISOString();
            const context = {
                topGainers,
                topLosers,
                lastUpdated: lastUpdatedStr,
            };
            if (requestedStock) {
                context.requestedStock = requestedStock;
            }
            if (compositeIndex !== undefined) {
                context.compositeIndex = compositeIndex;
            }
            if (lastUpdated) {
                const ageMs = Date.now() - lastUpdated.getTime();
                if (ageMs > ai_constants_1.DATA_FRESHNESS_THRESHOLD_MS) {
                    this.logger.debug(`Market data is ${Math.round(ageMs / 60000)} minutes old`);
                }
            }
            return context;
        }
        catch (error) {
            this.logger.error('Failed to build market context', error?.message);
            return undefined;
        }
    }
    async buildPortfolioContext(userId, isKycVerified) {
        if (!isKycVerified) {
            this.logger.debug(`Portfolio context excluded for user ${userId}: KYC not verified`);
            return undefined;
        }
        try {
            const portfolioPromise = this.portfolioService.getUserPortfolio(userId);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Portfolio data retrieval timed out')), ai_constants_1.DATA_SOURCE_TIMEOUT_MS));
            const portfolio = await Promise.race([portfolioPromise, timeoutPromise]);
            if (!portfolio.holdings || portfolio.holdings.length === 0) {
                this.logger.debug(`Portfolio context omitted for user ${userId}: no holdings`);
                return undefined;
            }
            const sortedHoldings = [...portfolio.holdings]
                .sort((a, b) => b.currentValue - a.currentValue)
                .slice(0, ai_constants_1.PORTFOLIO_CONTEXT_MAX_HOLDINGS);
            const holdings = sortedHoldings.map((h) => ({
                symbol: h.symbol,
                quantity: h.quantity,
                averageCost: Number(h.averageCost),
                currentValue: h.currentValue,
                unrealizedGainLoss: h.pnl,
            }));
            return {
                holdings,
                totalValue: portfolio.summary.totalValue,
                totalPnl: portfolio.summary.totalPnl,
            };
        }
        catch (error) {
            this.logger.error(`Failed to build portfolio context for user ${userId}`, error?.message);
            return undefined;
        }
    }
    async buildNewsContext(symbols, isSentimentQuery) {
        try {
            const newsPromise = this.fetchNewsArticles(symbols, isSentimentQuery);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('News data retrieval timed out')), ai_constants_1.DATA_SOURCE_TIMEOUT_MS));
            const articles = await Promise.race([newsPromise, timeoutPromise]);
            if (!articles || articles.length === 0) {
                this.logger.debug('No news articles found for context');
                return undefined;
            }
            const contextArticles = articles.map((article) => ({
                title: article.title,
                summary: this.truncateSummary(article.summary),
                source: article.source,
                publishedAt: article.createdAt,
                relatedSymbols: article.relatedSymbols || [],
            }));
            return { articles: contextArticles };
        }
        catch (error) {
            this.logger.error('Failed to build news context', error?.message);
            return undefined;
        }
    }
    async fetchNewsArticles(symbols, isSentimentQuery) {
        if (symbols.length > 0 && !isSentimentQuery) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - ai_constants_1.NEWS_RECENCY_DAYS);
            const results = [];
            for (const symbol of symbols) {
                const { data } = await this.newsAggregatorService.getAllNews({
                    symbol,
                    limit: ai_constants_1.NEWS_STOCK_QUERY_MAX_ARTICLES * 2,
                });
                const recentArticles = data.filter((article) => {
                    const articleDate = new Date(article.createdAt);
                    return articleDate >= sevenDaysAgo;
                });
                results.push(...recentArticles);
            }
            const uniqueArticles = this.deduplicateArticles(results);
            return uniqueArticles.slice(0, ai_constants_1.NEWS_STOCK_QUERY_MAX_ARTICLES);
        }
        else {
            const trendingArticles = await this.newsAggregatorService.getTrendingNews(ai_constants_1.NEWS_TRENDING_MAX_ARTICLES);
            return trendingArticles;
        }
    }
    truncateSummary(summary) {
        if (!summary)
            return '';
        if (summary.length <= ai_constants_1.NEWS_SUMMARY_MAX_LENGTH)
            return summary;
        return summary.substring(0, ai_constants_1.NEWS_SUMMARY_MAX_LENGTH - 3) + '...';
    }
    deduplicateArticles(articles) {
        const seen = new Set();
        return articles.filter((article) => {
            if (seen.has(article.id))
                return false;
            seen.add(article.id);
            return true;
        });
    }
    extractStockSymbols(message) {
        if (!message || typeof message !== 'string') {
            return [];
        }
        const lowerMessage = message.toLowerCase();
        const matchedSymbols = new Set();
        const liveStocks = this.gseService.getAllLive();
        const liveCacheSymbols = liveStocks.map((s) => s.name.toUpperCase());
        for (const [symbol, aliases] of Object.entries(exports.GSE_SYMBOL_MAP)) {
            const symbolLower = symbol.toLowerCase();
            if (this.matchesWordBoundary(lowerMessage, symbolLower)) {
                matchedSymbols.add(symbol);
                continue;
            }
            for (const alias of aliases) {
                if (this.matchesWordBoundary(lowerMessage, alias)) {
                    matchedSymbols.add(symbol);
                    break;
                }
            }
        }
        for (const cacheSymbol of liveCacheSymbols) {
            if (!matchedSymbols.has(cacheSymbol)) {
                const symbolLower = cacheSymbol.toLowerCase();
                if (this.matchesWordBoundary(lowerMessage, symbolLower)) {
                    matchedSymbols.add(cacheSymbol);
                }
            }
        }
        return Array.from(matchedSymbols);
    }
    matchesWordBoundary(text, term) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        return regex.test(text);
    }
    calculateCompositeIndex(stocks) {
        if (!stocks || stocks.length === 0) {
            return undefined;
        }
        const totalPrice = stocks.reduce((sum, stock) => sum + stock.price, 0);
        return Math.round((totalPrice / stocks.length) * 100) / 100;
    }
    getTopGainersAndLosers(stocks) {
        if (!stocks || stocks.length === 0) {
            return { topGainers: [], topLosers: [] };
        }
        const sorted = [...stocks].sort((a, b) => b.change - a.change);
        const topGainers = sorted.slice(0, 5).map((s) => ({
            symbol: s.name.toUpperCase(),
            changePercent: s.change,
        }));
        const topLosers = sorted
            .slice(-5)
            .reverse()
            .map((s) => ({
            symbol: s.name.toUpperCase(),
            changePercent: s.change,
        }));
        return { topGainers, topLosers };
    }
};
exports.ContextBuilderService = ContextBuilderService;
exports.ContextBuilderService = ContextBuilderService = ContextBuilderService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [gse_service_1.GseService,
        portfolio_service_1.PortfolioService,
        news_aggregator_service_1.NewsAggregatorService])
], ContextBuilderService);
//# sourceMappingURL=context-builder.service.js.map
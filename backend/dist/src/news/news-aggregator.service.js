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
var NewsAggregatorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsAggregatorService = void 0;
const common_1 = require("@nestjs/common");
let NewsAggregatorService = NewsAggregatorService_1 = class NewsAggregatorService {
    constructor() {
        this.logger = new common_1.Logger(NewsAggregatorService_1.name);
        this.newsCache = [];
        this.lastFetch = null;
        this.CACHE_DURATION = 15 * 60 * 1000;
        this.fetchAndCacheNews();
    }
    async getAllNews(params) {
        if (!this.lastFetch || Date.now() - this.lastFetch.getTime() > this.CACHE_DURATION) {
            await this.fetchAndCacheNews();
        }
        let filteredNews = [...this.newsCache];
        if (params.category && params.category !== 'all') {
            filteredNews = filteredNews.filter((news) => news.category.toLowerCase() === params.category.toLowerCase());
        }
        if (params.symbol) {
            filteredNews = filteredNews.filter((news) => news.relatedSymbols?.includes(params.symbol));
        }
        const total = filteredNews.length;
        const offset = params.offset || 0;
        const limit = params.limit || 20;
        const paginatedNews = filteredNews.slice(offset, offset + limit);
        return { data: paginatedNews, total };
    }
    async getTrendingNews(limit = 10) {
        if (!this.lastFetch || Date.now() - this.lastFetch.getTime() > this.CACHE_DURATION) {
            await this.fetchAndCacheNews();
        }
        return this.newsCache
            .sort((a, b) => b.viewCount - a.viewCount)
            .slice(0, limit);
    }
    async fetchAndCacheNews() {
        try {
            this.logger.log('Fetching Ghana finance news...');
            const sampleNews = this.generateSampleGhanaFinanceNews();
            this.newsCache = sampleNews;
            this.lastFetch = new Date();
            this.logger.log(`Cached ${sampleNews.length} news articles`);
        }
        catch (error) {
            this.logger.error('Failed to fetch news:', error.message);
            if (this.newsCache.length === 0) {
                this.newsCache = this.generateSampleGhanaFinanceNews();
            }
        }
    }
    generateSampleGhanaFinanceNews() {
        const now = new Date();
        const articles = [];
        const companies = ['MTN Ghana', 'GCB Bank', 'Standard Chartered', 'GOIL', 'CAL Bank', 'Ecobank Ghana', 'Tullow Oil', 'AngloGold Ashanti'];
        const symbols = [['MTNGH'], ['GCB'], ['SCB'], ['GOIL'], ['CAL'], ['EGH'], ['TLW'], ['AGA']];
        const categories = ['market', 'company', 'economy', 'analysis', 'regulation'];
        const sources = ['Ghana Business News', 'Business & Financial Times', 'Graphic Business', 'Citi Business News', 'Joy Business'];
        const images = [
            'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
            'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800',
            'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=800',
            'https://images.unsplash.com/photo-1545262810-77515befe149?w=800',
            'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800',
        ];
        for (let i = 1; i <= 60; i++) {
            const hoursAgo = i * 2;
            const companyIndex = (i - 1) % companies.length;
            const categoryIndex = (i - 1) % categories.length;
            articles.push({
                id: i.toString(),
                title: this.generateTitle(i, companies[companyIndex]),
                content: this.generateContent(i, companies[companyIndex]),
                summary: this.generateSummary(i, companies[companyIndex]),
                source: sources[i % sources.length],
                sourceUrl: 'https://www.ghanabusinessnews.com',
                imageUrl: images[i % images.length],
                relatedSymbols: i % 3 === 0 ? [] : symbols[companyIndex],
                category: categories[categoryIndex],
                viewCount: Math.floor(Math.random() * 3000) + 500,
                commentCount: Math.floor(Math.random() * 50),
                reactionCount: Math.floor(Math.random() * 150),
                createdAt: new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString(),
                updatedAt: new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString(),
            });
        }
        return articles;
    }
    generateTitle(index, company) {
        const titles = [
            `${company} Reports Strong Q${(index % 4) + 1} Performance`,
            `Ghana Stock Exchange Sees ${5 + (index % 15)}% Growth`,
            `${company} Announces Major Expansion Plans`,
            `Bank of Ghana Updates Monetary Policy Framework`,
            `${company} Achieves Record Revenue Milestone`,
            `Analysts Upgrade ${company} Stock Rating`,
            `Ghana's Economy Shows Resilient Growth`,
            `${company} Launches New Digital Services`,
            `Foreign Investment in ${company} Increases`,
            `${company} Reports ${10 + (index % 20)}% Profit Growth`,
        ];
        return titles[index % titles.length];
    }
    generateContent(index, company) {
        const contents = [
            `${company} has demonstrated exceptional performance in recent quarters, driven by strategic initiatives and market expansion. The company's focus on innovation and customer service has positioned it as a market leader in Ghana's financial sector.`,
            `Market analysts report significant developments in the Ghanaian financial sector, with ${company} leading the charge. Industry experts predict continued growth as the company expands its operations and introduces new products to meet evolving customer needs.`,
            `${company} announced today that it has achieved remarkable milestones in its operational efficiency and market reach. The company's management attributes this success to its dedicated workforce and strategic partnerships across the region.`,
            `In a significant development for Ghana's economy, ${company} has unveiled plans for major investments in infrastructure and technology. This move is expected to create numerous employment opportunities and boost economic activity in key sectors.`,
            `${company} continues to strengthen its position in the market through innovative solutions and customer-centric approaches. The company's latest financial results reflect strong fundamentals and sustainable growth trajectory.`,
        ];
        return contents[index % contents.length];
    }
    generateSummary(index, company) {
        const summaries = [
            `${company} shows strong performance with ${10 + (index % 20)}% growth.`,
            `Market analysts positive on ${company}'s outlook.`,
            `${company} expands operations across Ghana.`,
            `Strong quarterly results from ${company}.`,
            `${company} announces strategic initiatives.`,
        ];
        return summaries[index % summaries.length];
    }
};
exports.NewsAggregatorService = NewsAggregatorService;
exports.NewsAggregatorService = NewsAggregatorService = NewsAggregatorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], NewsAggregatorService);
//# sourceMappingURL=news-aggregator.service.js.map
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
var InsightGeneratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsightGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../supabase/supabase.service");
const gse_service_1 = require("../../gse/gse.service");
const news_aggregator_service_1 = require("../../news/news-aggregator.service");
const ai_service_1 = require("../ai.service");
const disclaimer_engine_service_1 = require("./disclaimer-engine.service");
const ai_constants_1 = require("../constants/ai.constants");
let InsightGeneratorService = InsightGeneratorService_1 = class InsightGeneratorService {
    constructor(supabaseService, gseService, newsAggregatorService, aiService, disclaimerEngine) {
        this.supabaseService = supabaseService;
        this.gseService = gseService;
        this.newsAggregatorService = newsAggregatorService;
        this.aiService = aiService;
        this.disclaimerEngine = disclaimerEngine;
        this.logger = new common_1.Logger(InsightGeneratorService_1.name);
    }
    async getInsights(userId, holdings) {
        const shouldGenerate = await this.shouldRefresh(userId);
        if (!shouldGenerate) {
            const cached = await this.getCachedInsights(userId);
            if (cached) {
                return cached;
            }
        }
        const news = await this.getRelevantNews(holdings);
        try {
            const insights = await this.generateInsights(userId, holdings, news);
            await this.cacheInsights(userId, insights);
            return insights;
        }
        catch (error) {
            this.logger.error(`Failed to generate insights for user ${userId}: ${error.message}`);
            const cached = await this.getCachedInsights(userId);
            if (cached) {
                return cached;
            }
            return null;
        }
    }
    async generateInsights(userId, holdings, news) {
        const hasHoldings = holdings && holdings.length > 0;
        let contextDescription;
        if (hasHoldings) {
            const topHoldings = holdings
                .sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0))
                .slice(0, ai_constants_1.INSIGHT_CONTEXT_MAX_HOLDINGS);
            const holdingsContext = topHoldings
                .map((h) => `${h.symbol}: ${h.quantity} shares, value GHS ${h.currentValue?.toFixed(2) || 'N/A'}, P&L: ${h.unrealizedGainLoss?.toFixed(2) || h.pnl?.toFixed(2) || '0.00'}`)
                .join('\n');
            contextDescription = `User's top holdings:\n${holdingsContext}`;
        }
        else {
            const liveStocks = this.gseService.getAllLive();
            const compositeInfo = liveStocks.length > 0
                ? `GSE market has ${liveStocks.length} active stocks. Top movers: ${liveStocks
                    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
                    .slice(0, 5)
                    .map((s) => `${s.name} (${s.change >= 0 ? '+' : ''}${s.change})`)
                    .join(', ')}`
                : 'GSE Composite Index data currently available';
            contextDescription = `User has no holdings. Market overview:\n${compositeInfo}`;
        }
        const newsContext = news.length > 0
            ? `\n\nRecent news:\n${news
                .slice(0, ai_constants_1.INSIGHT_CONTEXT_MAX_NEWS)
                .map((n) => `- ${n.title} (${n.source}, ${n.relatedSymbols?.join(', ') || 'general'})`)
                .join('\n')}`
            : '';
        const prompt = `Based on the following market context, generate exactly ${ai_constants_1.INSIGHT_MAX_CARDS} brief market insight cards in JSON format.

${contextDescription}${newsContext}

Each insight card must have:
- "title": a concise headline (max ${ai_constants_1.INSIGHT_TITLE_MAX_LENGTH} characters)
- "summary": a brief explanation (max ${ai_constants_1.INSIGHT_SUMMARY_MAX_LENGTH} characters)
- "relevanceSymbol": the most relevant stock symbol or "GSE" for general market insights

Respond ONLY with a JSON array of ${ai_constants_1.INSIGHT_MAX_CARDS} objects. No other text.
Example format:
[{"title":"...","summary":"...","relevanceSymbol":"MTNGH"}]`;
        const messages = [
            {
                role: 'system',
                content: 'You are a Ghana Stock Exchange market analyst. Generate concise, factual market insight cards. Never provide investment advice. Keep titles under 80 characters and summaries under 150 characters.',
            },
            { role: 'user', content: prompt },
        ];
        const response = await this.aiService.callLLM(messages, 600);
        const insights = this.parseInsightsResponse(response, userId);
        return insights;
    }
    async getCachedInsights(userId) {
        try {
            const client = this.supabaseService.getAdminClient();
            const { data, error } = await client
                .from('ai_insights_cache')
                .select('*')
                .eq('user_id', userId)
                .order('generated_at', { ascending: false })
                .limit(1)
                .single();
            if (error || !data) {
                return null;
            }
            const generatedAt = new Date(data.generated_at).getTime();
            const now = Date.now();
            if (now - generatedAt > ai_constants_1.INSIGHT_CACHE_EXPIRY_MS) {
                return null;
            }
            const insights = data.insights;
            return Array.isArray(insights) ? insights : null;
        }
        catch (error) {
            this.logger.warn(`Failed to read cached insights for user ${userId}: ${error.message}`);
            return null;
        }
    }
    async cacheInsights(userId, insights) {
        try {
            const client = this.supabaseService.getAdminClient();
            const expiresAt = new Date(Date.now() + ai_constants_1.INSIGHT_CACHE_EXPIRY_MS).toISOString();
            await client
                .from('ai_insights_cache')
                .delete()
                .eq('user_id', userId);
            const { error } = await client.from('ai_insights_cache').insert({
                user_id: userId,
                insights: insights,
                generated_at: new Date().toISOString(),
                expires_at: expiresAt,
            });
            if (error) {
                this.logger.warn(`Failed to cache insights for user ${userId}: ${error.message}`);
            }
        }
        catch (error) {
            this.logger.warn(`Failed to cache insights for user ${userId}: ${error.message}`);
        }
    }
    async shouldRefresh(userId) {
        try {
            const client = this.supabaseService.getAdminClient();
            const { data, error } = await client
                .from('ai_insights_cache')
                .select('generated_at')
                .eq('user_id', userId)
                .order('generated_at', { ascending: false })
                .limit(1)
                .single();
            if (error || !data) {
                return true;
            }
            const generatedAt = new Date(data.generated_at).getTime();
            const now = Date.now();
            return now - generatedAt >= ai_constants_1.INSIGHT_REFRESH_THROTTLE_MS;
        }
        catch (error) {
            this.logger.warn(`Failed to check refresh throttle for user ${userId}: ${error.message}`);
            return true;
        }
    }
    async getRelevantNews(holdings) {
        try {
            if (holdings && holdings.length > 0) {
                const topHoldings = holdings
                    .sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0))
                    .slice(0, ai_constants_1.INSIGHT_CONTEXT_MAX_HOLDINGS);
                const symbols = topHoldings
                    .map((h) => h.symbol)
                    .filter(Boolean);
                const allNews = [];
                for (const symbol of symbols) {
                    const { data } = await this.newsAggregatorService.getAllNews({
                        symbol,
                        limit: ai_constants_1.INSIGHT_CONTEXT_MAX_NEWS,
                    });
                    allNews.push(...data);
                }
                const uniqueNews = Array.from(new Map(allNews.map((n) => [n.id, n])).values()).slice(0, ai_constants_1.INSIGHT_CONTEXT_MAX_NEWS);
                return uniqueNews;
            }
            else {
                const trending = await this.newsAggregatorService.getTrendingNews(ai_constants_1.INSIGHT_CONTEXT_MAX_NEWS);
                return trending;
            }
        }
        catch (error) {
            this.logger.warn(`Failed to fetch news for insights: ${error.message}`);
            return [];
        }
    }
    parseInsightsResponse(response, userId) {
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                this.logger.warn('No JSON array found in LLM insight response');
                return this.generateFallbackInsights(userId);
            }
            const parsed = JSON.parse(jsonMatch[0]);
            if (!Array.isArray(parsed)) {
                return this.generateFallbackInsights(userId);
            }
            const insights = parsed
                .slice(0, ai_constants_1.INSIGHT_MAX_CARDS)
                .map((item, index) => ({
                id: `insight-${userId}-${Date.now()}-${index}`,
                title: this.truncate(item.title || 'Market Update', ai_constants_1.INSIGHT_TITLE_MAX_LENGTH),
                summary: this.truncate(item.summary || 'Check the latest market developments.', ai_constants_1.INSIGHT_SUMMARY_MAX_LENGTH),
                relevanceSymbol: item.relevanceSymbol || 'GSE',
                disclaimer: this.disclaimerEngine.getDisclaimer(),
                generatedAt: new Date().toISOString(),
            }));
            return insights;
        }
        catch (error) {
            this.logger.warn(`Failed to parse LLM insight response: ${error.message}`);
            return this.generateFallbackInsights(userId);
        }
    }
    generateFallbackInsights(userId) {
        const liveStocks = this.gseService.getAllLive();
        const topMover = liveStocks.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0];
        const insights = [
            {
                id: `insight-${userId}-${Date.now()}-0`,
                title: 'GSE Market Overview',
                summary: `The Ghana Stock Exchange has ${liveStocks.length} actively traded stocks today. Monitor volume trends for trading opportunities.`,
                relevanceSymbol: 'GSE',
                disclaimer: this.disclaimerEngine.getDisclaimer(),
                generatedAt: new Date().toISOString(),
            },
        ];
        if (topMover) {
            insights.push({
                id: `insight-${userId}-${Date.now()}-1`,
                title: `${topMover.name} Shows Notable Movement`,
                summary: this.truncate(`${topMover.name} moved ${topMover.change >= 0 ? '+' : ''}${topMover.change} today at GHS ${topMover.price}. Review fundamentals before acting.`, ai_constants_1.INSIGHT_SUMMARY_MAX_LENGTH),
                relevanceSymbol: topMover.name,
                disclaimer: this.disclaimerEngine.getDisclaimer(),
                generatedAt: new Date().toISOString(),
            });
        }
        return insights.slice(0, ai_constants_1.INSIGHT_MAX_CARDS);
    }
    truncate(text, maxLength) {
        if (!text)
            return '';
        if (text.length <= maxLength)
            return text;
        return text.substring(0, maxLength - 3) + '...';
    }
};
exports.InsightGeneratorService = InsightGeneratorService;
exports.InsightGeneratorService = InsightGeneratorService = InsightGeneratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        gse_service_1.GseService,
        news_aggregator_service_1.NewsAggregatorService,
        ai_service_1.AiService,
        disclaimer_engine_service_1.DisclaimerEngineService])
], InsightGeneratorService);
//# sourceMappingURL=insight-generator.service.js.map
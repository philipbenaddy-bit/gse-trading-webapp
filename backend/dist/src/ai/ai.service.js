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
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitExceededError = exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const gse_service_1 = require("../gse/gse.service");
const prompt_guard_service_1 = require("./services/prompt-guard.service");
const context_builder_service_1 = require("./services/context-builder.service");
const rate_limiter_service_1 = require("./services/rate-limiter.service");
const circuit_breaker_service_1 = require("./services/circuit-breaker.service");
const conversation_store_service_1 = require("./services/conversation-store.service");
const disclaimer_engine_service_1 = require("./services/disclaimer-engine.service");
const audit_logger_service_1 = require("./services/audit-logger.service");
const ai_constants_1 = require("./constants/ai.constants");
const system_prompt_template_1 = require("./templates/system-prompt.template");
const LLM_FALLBACK_RESPONSE = 'AI analysis is temporarily unavailable. Your question has been saved and you can try again shortly.';
const UNSAFE_OUTPUT_MESSAGE = "I wasn't able to complete that analysis. Please try rephrasing your question.";
const SYSTEM_PROMPT_FRAGMENTS = [
    'SCOPE',
    'STRICTLY FORBIDDEN',
    'RESPONSE GUIDELINES',
    'You ONLY discuss',
    'You must NEVER',
];
const API_KEY_PATTERNS = [
    /sk-[a-zA-Z0-9]{20,}/,
    /key-[a-zA-Z0-9]{20,}/,
    /sk-proj-[a-zA-Z0-9]{20,}/,
    /xai-[a-zA-Z0-9]{20,}/,
];
const INTERNAL_SERVICE_NAMES = [
    'PromptGuard',
    'ContextBuilder',
    'CircuitBreaker',
    'RateLimiter',
    'ConversationStore',
    'DisclaimerEngine',
    'AuditLogger',
    'NestJS',
    'Supabase',
];
let AiService = AiService_1 = class AiService {
    constructor(config, gseService, promptGuardService, contextBuilderService, rateLimiterService, circuitBreakerService, conversationStoreService, disclaimerEngineService, auditLoggerService) {
        this.config = config;
        this.gseService = gseService;
        this.promptGuardService = promptGuardService;
        this.contextBuilderService = contextBuilderService;
        this.rateLimiterService = rateLimiterService;
        this.circuitBreakerService = circuitBreakerService;
        this.conversationStoreService = conversationStoreService;
        this.disclaimerEngineService = disclaimerEngineService;
        this.auditLoggerService = auditLoggerService;
        this.logger = new common_1.Logger(AiService_1.name);
        this.openaiKey = config.get('OPENAI_API_KEY', '');
        this.anthropicKey = config.get('ANTHROPIC_API_KEY', '');
    }
    get hasAiKey() {
        return !!(this.openaiKey || this.anthropicKey);
    }
    async chat(userId, message, conversationId) {
        const startTime = Date.now();
        const { sanitized, valid, injectionDetected, error: guardError } = this.promptGuardService.processInput(message, conversationId || userId);
        if (!valid && !injectionDetected) {
            throw new Error(guardError || 'Invalid input');
        }
        if (injectionDetected) {
            await this.auditLoggerService.logSecurityEvent({
                userId,
                sanitizedInput: sanitized,
                detectionReason: 'prompt_injection',
            });
            await this.auditLoggerService.logInteraction({
                userId,
                requestType: 'chat',
                tokenCount: 0,
                responseStatus: 'rejected',
                durationMs: Date.now() - startTime,
            });
            const rateLimitInfo = await this.rateLimiterService.checkLimit(userId);
            return {
                conversationId: conversationId || '',
                messageId: '',
                reply: prompt_guard_service_1.GENERIC_REFUSAL_MESSAGE,
                disclaimer: this.disclaimerEngineService.getDisclaimer(),
                rateLimitInfo,
                dataSources: [],
            };
        }
        const rateLimitInfo = await this.rateLimiterService.checkLimit(userId);
        if (rateLimitInfo.limitExceeded) {
            await this.auditLoggerService.logInteraction({
                userId,
                requestType: 'chat',
                tokenCount: 0,
                responseStatus: 'rate_limited',
                durationMs: Date.now() - startTime,
            });
            throw new RateLimitExceededError(rateLimitInfo);
        }
        let activeConversationId = conversationId;
        if (!activeConversationId) {
            const conversation = await this.conversationStoreService.createConversation(userId, this.generateConversationTitle(sanitized));
            activeConversationId = conversation.id;
        }
        const userTokenCount = this.estimateTokenCount(sanitized);
        await this.conversationStoreService.addMessage(activeConversationId, 'user', sanitized, userTokenCount);
        const dataSources = [];
        const unavailableSources = [];
        const extractedSymbols = this.contextBuilderService.extractStockSymbols(sanitized);
        let marketContext;
        try {
            marketContext = await this.contextBuilderService.buildMarketContext(sanitized);
            if (marketContext)
                dataSources.push('market_data');
            else
                unavailableSources.push('market_data');
        }
        catch {
            unavailableSources.push('market_data');
        }
        let portfolioContext;
        try {
            portfolioContext = await this.contextBuilderService.buildPortfolioContext(userId, true);
            if (portfolioContext)
                dataSources.push('portfolio');
        }
        catch {
            unavailableSources.push('portfolio');
        }
        let newsContext;
        try {
            const isSentimentQuery = this.isSentimentQuery(sanitized);
            newsContext = await this.contextBuilderService.buildNewsContext(extractedSymbols, isSentimentQuery);
            if (newsContext)
                dataSources.push('news');
        }
        catch {
            unavailableSources.push('news');
        }
        const conversationHistory = await this.conversationStoreService.getContextWindow(activeConversationId);
        const systemPrompt = (0, system_prompt_template_1.buildSystemPrompt)({ currentDate: new Date().toISOString() });
        const contextBlock = this.buildContextBlock(marketContext, portfolioContext, newsContext, unavailableSources);
        const messages = [
            { role: 'system', content: `${systemPrompt}\n\n${contextBlock}` },
            ...conversationHistory.slice(0, -1),
            { role: 'user', content: sanitized },
        ];
        let llmResponse;
        let responseStatus = 'success';
        try {
            llmResponse = await this.callLLM(messages, ai_constants_1.TOKEN_BUDGET_MAX);
        }
        catch (err) {
            responseStatus = err.message?.includes('timeout') ? 'timeout' : 'error';
            llmResponse = LLM_FALLBACK_RESPONSE;
        }
        if (responseStatus === 'success' && !this.validateOutput(llmResponse)) {
            this.logger.warn('LLM output failed safety validation, returning safe message');
            llmResponse = UNSAFE_OUTPUT_MESSAGE;
            responseStatus = 'error';
        }
        if (unavailableSources.length > 0 && responseStatus === 'success') {
            const sourceNotes = unavailableSources.map((source) => {
                switch (source) {
                    case 'market_data':
                        return 'Note: Current market data is temporarily unavailable.';
                    case 'portfolio':
                        return 'Note: Portfolio data could not be loaded.';
                    case 'news':
                        return 'Note: Recent news data is not available.';
                    default:
                        return `Note: ${source} is temporarily unavailable.`;
                }
            });
            llmResponse = `${llmResponse}\n\n${sourceNotes.join('\n')}`;
        }
        const assistantTokenCount = this.estimateTokenCount(llmResponse);
        const assistantMessage = await this.conversationStoreService.addMessage(activeConversationId, 'assistant', llmResponse, assistantTokenCount);
        if (responseStatus === 'success') {
            await this.rateLimiterService.recordRequest(userId);
        }
        await this.auditLoggerService.logInteraction({
            userId,
            requestType: 'chat',
            tokenCount: userTokenCount + assistantTokenCount,
            responseStatus,
            durationMs: Date.now() - startTime,
        });
        const updatedRateLimitInfo = await this.rateLimiterService.checkLimit(userId);
        return {
            conversationId: activeConversationId,
            messageId: assistantMessage.id,
            reply: llmResponse,
            disclaimer: this.disclaimerEngineService.getDisclaimer(),
            rateLimitInfo: updatedRateLimitInfo,
            dataSources,
        };
    }
    async callLLM(messages, maxTokens = ai_constants_1.TOKEN_BUDGET_MAX) {
        const canExecute = await this.circuitBreakerService.canExecute();
        if (!canExecute) {
            this.logger.warn('Circuit breaker is open, rejecting LLM call');
            throw new Error('Circuit breaker open: LLM service unavailable');
        }
        const effectiveMaxTokens = Math.min(maxTokens, ai_constants_1.TOKEN_BUDGET_MAX);
        if (!this.hasAiKey) {
            return this.generateFallbackResponse(messages);
        }
        if (this.openaiKey) {
            try {
                const response = await this.callOpenAI(messages, effectiveMaxTokens);
                await this.circuitBreakerService.recordSuccess();
                return response;
            }
            catch (primaryError) {
                this.logger.warn(`OpenAI call failed: ${primaryError.message}`);
            }
        }
        if (this.anthropicKey) {
            try {
                const response = await this.callAnthropic(messages, effectiveMaxTokens);
                await this.circuitBreakerService.recordSuccess();
                return response;
            }
            catch (fallbackError) {
                this.logger.error(`Anthropic fallback also failed: ${fallbackError.message}`);
            }
        }
        await this.circuitBreakerService.recordFailure();
        throw new Error('LLM call failed: all providers unavailable');
    }
    async callOpenAI(messages, maxTokens) {
        const response = await axios_1.default.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o-mini',
            messages,
            max_tokens: maxTokens,
            temperature: 0.7,
        }, {
            headers: {
                Authorization: `Bearer ${this.openaiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: ai_constants_1.LLM_TIMEOUT_MS,
        });
        return response.data.choices[0].message.content;
    }
    async callAnthropic(messages, maxTokens) {
        const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
        const userMessages = messages.filter((m) => m.role !== 'system');
        const response = await axios_1.default.post('https://api.anthropic.com/v1/messages', {
            model: 'claude-3-haiku-20240307',
            max_tokens: maxTokens,
            system: systemMsg,
            messages: userMessages,
        }, {
            headers: {
                'x-api-key': this.anthropicKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
            },
            timeout: ai_constants_1.LLM_TIMEOUT_MS,
        });
        return response.data.content[0].text;
    }
    validateOutput(response) {
        if (!response || typeof response !== 'string') {
            return false;
        }
        for (const fragment of SYSTEM_PROMPT_FRAGMENTS) {
            if (response.includes(fragment)) {
                this.logger.warn(`Output validation failed: contains system prompt fragment "${fragment}"`);
                return false;
            }
        }
        for (const pattern of API_KEY_PATTERNS) {
            if (pattern.test(response)) {
                this.logger.warn('Output validation failed: contains API key pattern');
                return false;
            }
        }
        for (const serviceName of INTERNAL_SERVICE_NAMES) {
            if (response.includes(serviceName)) {
                this.logger.warn(`Output validation failed: contains internal service name "${serviceName}"`);
                return false;
            }
        }
        return true;
    }
    buildContextBlock(marketData, portfolioData, newsData, unavailableSources) {
        const sections = [];
        if (marketData) {
            let marketSection = 'MARKET DATA:\n';
            if (marketData.requestedStock) {
                const s = marketData.requestedStock;
                marketSection += `Requested Stock: ${s.symbol} — Price: GHS ${s.price}, Change: ${s.changePercent >= 0 ? '+' : ''}${s.changePercent}%, Volume: ${s.volume}\n`;
            }
            if (marketData.compositeIndex !== undefined) {
                marketSection += `GSE Composite Index: ${marketData.compositeIndex}\n`;
            }
            if (marketData.topGainers?.length > 0) {
                marketSection += `Top Gainers: ${marketData.topGainers.map((g) => `${g.symbol} (+${g.changePercent}%)`).join(', ')}\n`;
            }
            if (marketData.topLosers?.length > 0) {
                marketSection += `Top Losers: ${marketData.topLosers.map((l) => `${l.symbol} (${l.changePercent}%)`).join(', ')}\n`;
            }
            marketSection += `Last Updated: ${marketData.lastUpdated}`;
            sections.push(marketSection);
        }
        if (portfolioData) {
            let portfolioSection = 'PORTFOLIO DATA:\n';
            portfolioSection += `Total Value: GHS ${portfolioData.totalValue.toFixed(2)}, Total P&L: GHS ${portfolioData.totalPnl.toFixed(2)}\n`;
            portfolioSection += `Holdings (${portfolioData.holdings.length}):\n`;
            for (const h of portfolioData.holdings.slice(0, 10)) {
                portfolioSection += `  ${h.symbol}: ${h.quantity} shares, Value: GHS ${h.currentValue.toFixed(2)}, P&L: GHS ${h.unrealizedGainLoss.toFixed(2)}\n`;
            }
            sections.push(portfolioSection);
        }
        if (newsData?.articles?.length > 0) {
            let newsSection = 'RECENT NEWS:\n';
            for (const article of newsData.articles) {
                newsSection += `- "${article.title}" (${article.source}, ${article.publishedAt})\n  ${article.summary}\n`;
            }
            sections.push(newsSection);
        }
        if (unavailableSources.length > 0) {
            sections.push(`UNAVAILABLE DATA SOURCES: ${unavailableSources.join(', ')}`);
        }
        return sections.join('\n\n');
    }
    generateConversationTitle(message) {
        const maxLength = 50;
        if (message.length <= maxLength)
            return message;
        return message.substring(0, maxLength - 3) + '...';
    }
    estimateTokenCount(text) {
        return Math.ceil(text.length / 4);
    }
    isSentimentQuery(message) {
        const sentimentKeywords = [
            'sentiment', 'trend', 'trending', 'market mood',
            'bullish', 'bearish', 'outlook', 'forecast',
        ];
        const lower = message.toLowerCase();
        return sentimentKeywords.some((kw) => lower.includes(kw));
    }
    generateFallbackResponse(messages) {
        const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';
        if (lastMsg.includes('portfolio')) {
            return 'Your portfolio shows a diversified mix of equities. Consider reviewing your sector allocation and ensuring you\'re not over-concentrated in any single stock. Regular rebalancing helps manage risk effectively.';
        }
        if (lastMsg.includes('buy') || lastMsg.includes('sell')) {
            return 'Trading decisions should be based on thorough research, including fundamental analysis, technical indicators, and your personal risk tolerance. Always consider the broader market context before executing trades.';
        }
        if (lastMsg.includes('market') || lastMsg.includes('gse')) {
            return 'The Ghana Stock Exchange offers opportunities across banking, telecom, and energy sectors. Monitor volume trends and price movements alongside company fundamentals for informed decisions.';
        }
        return "I'm your AI trading assistant. I can help analyze your portfolio, discuss market trends, and provide insights on specific stocks. What would you like to explore today?";
    }
    async legacyChat(message, history, userId) {
        const liveStocks = this.gseService.getAllLive().slice(0, 10);
        const marketContext = liveStocks
            .map((s) => `${s.name}: GHS ${s.price} (${s.change >= 0 ? '+' : ''}${s.change})`)
            .join(', ');
        const systemPrompt = `You are an expert AI trading assistant for a stock trading platform focused on the Ghana Stock Exchange (GSE). 
You provide concise, actionable insights about stocks, portfolio management, and market trends.
Current market snapshot: ${marketContext}
Keep responses under 200 words. Be direct and professional. Format key numbers clearly.`;
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.slice(-6),
            { role: 'user', content: message },
        ];
        return this.callLLM(messages, 300);
    }
    async getStockInsight(symbol) {
        try {
            const live = this.gseService.getLiveBySymbol(symbol);
            const equity = this.gseService.getEquityBySymbol(symbol);
            if (!live) {
                return this.buildFallbackInsight(symbol);
            }
            const prompt = `Analyze this GSE stock briefly:
Symbol: ${symbol}
Price: GHS ${live.price}
Change: ${live.change >= 0 ? '+' : ''}${live.change}
Volume: ${live.volume}
${equity?.company?.sector ? `Sector: ${equity.company.sector}` : ''}
${equity?.eps ? `EPS: ${equity.eps}` : ''}
${equity?.dps ? `DPS: ${equity.dps}` : ''}

Respond in JSON only:
{
  "sentiment": "bullish|bearish|neutral",
  "score": <-1 to 1>,
  "summary": "<2 sentences>",
  "keyPoints": ["<point1>", "<point2>", "<point3>"],
  "recommendation": "buy|sell|hold",
  "confidence": <0-100>
}`;
            try {
                const raw = await this.callLLM([{ role: 'user', content: prompt }], 256);
                const json = raw.match(/\{[\s\S]*\}/)?.[0];
                if (!json)
                    throw new Error('No JSON in response');
                const parsed = JSON.parse(json);
                if (!parsed.sentiment || !parsed.recommendation)
                    throw new Error('Invalid response shape');
                return { symbol, ...parsed };
            }
            catch {
                return this.buildFallbackInsight(symbol, live);
            }
        }
        catch (err) {
            this.logger.error(`getStockInsight failed for ${symbol}`, err);
            return this.buildFallbackInsight(symbol);
        }
    }
    buildFallbackInsight(symbol, live) {
        const change = live?.change ?? 0;
        const sentiment = change > 0 ? 'bullish' : change < 0 ? 'bearish' : 'neutral';
        return {
            symbol,
            sentiment,
            score: Math.max(-1, Math.min(1, change / 5)),
            summary: `${symbol} is currently trading at GHS ${live?.price ?? 'N/A'} with a ${change >= 0 ? 'positive' : 'negative'} movement today. Monitor volume for confirmation of trend direction.`,
            keyPoints: [
                `Price: GHS ${live?.price ?? 'N/A'}`,
                `Daily change: ${change >= 0 ? '+' : ''}${change}`,
                `Volume: ${live?.volume?.toLocaleString() ?? 'N/A'}`,
            ],
            recommendation: change > 1 ? 'buy' : change < -1 ? 'sell' : 'hold',
            confidence: 55,
        };
    }
    async getNewsSentiment(symbol, headlines) {
        if (!headlines.length) {
            return { sentiment: 'neutral', score: 0, summary: 'No recent news available.' };
        }
        const bullishWords = ['growth', 'profit', 'gain', 'rise', 'surge', 'strong', 'positive', 'record', 'dividend', 'expansion', 'beat', 'exceed'];
        const bearishWords = ['loss', 'decline', 'fall', 'drop', 'weak', 'negative', 'miss', 'cut', 'reduce', 'concern', 'risk', 'debt'];
        let score = 0;
        const text = headlines.join(' ').toLowerCase();
        bullishWords.forEach((w) => { if (text.includes(w))
            score += 0.15; });
        bearishWords.forEach((w) => { if (text.includes(w))
            score -= 0.15; });
        score = Math.max(-1, Math.min(1, score));
        const sentiment = score > 0.1 ? 'bullish' : score < -0.1 ? 'bearish' : 'neutral';
        if (this.hasAiKey && headlines.length > 0) {
            try {
                const prompt = `Analyze sentiment for ${symbol} from these headlines: ${headlines.slice(0, 5).join('; ')}. 
Reply in JSON: {"sentiment":"bullish|bearish|neutral","score":<-1 to 1>,"summary":"<1 sentence>"}`;
                const raw = await this.callLLM([{ role: 'user', content: prompt }], 150);
                const json = raw.match(/\{[\s\S]*\}/)?.[0];
                if (json)
                    return JSON.parse(json);
            }
            catch {
            }
        }
        return {
            sentiment,
            score: parseFloat(score.toFixed(2)),
            summary: `News sentiment for ${symbol} is ${sentiment} based on ${headlines.length} recent articles.`,
        };
    }
    async analyzePortfolio(holdings, summary) {
        if (!holdings.length) {
            return {
                overallHealth: 'fair',
                score: 50,
                summary: 'Your portfolio is empty. Start by investing in diversified GSE stocks.',
                strengths: [],
                risks: ['No holdings — no market exposure'],
                suggestions: ['Consider starting with blue-chip GSE stocks', 'Diversify across sectors'],
                diversificationScore: 0,
                riskLevel: 'low',
            };
        }
        const totalValue = summary?.totalValue || 1;
        const maxAllocation = Math.max(...holdings.map((h) => h.currentValue / totalValue));
        const diversificationScore = Math.round((1 - maxAllocation) * 100);
        const holdingsSummary = holdings
            .map((h) => `${h.symbol}: ${h.quantity} shares @ GHS ${h.currentPrice}, P&L: ${h.pnlPercent}%`)
            .join('\n');
        const prompt = `Analyze this stock portfolio:
${holdingsSummary}
Total Value: GHS ${totalValue.toFixed(2)}
Total P&L: ${summary?.totalPnlPercent?.toFixed(2)}%

Respond in JSON only:
{
  "overallHealth": "excellent|good|fair|poor",
  "score": <0-100>,
  "summary": "<2-3 sentences>",
  "strengths": ["<s1>", "<s2>"],
  "risks": ["<r1>", "<r2>"],
  "suggestions": ["<sug1>", "<sug2>", "<sug3>"],
  "riskLevel": "low|medium|high"
}`;
        try {
            const raw = await this.callLLM([{ role: 'user', content: prompt }], 400);
            const json = raw.match(/\{[\s\S]*\}/)?.[0];
            if (!json)
                throw new Error('No JSON');
            const parsed = JSON.parse(json);
            return { ...parsed, diversificationScore };
        }
        catch {
            return this.buildFallbackPortfolioAnalysis(holdings, summary, diversificationScore);
        }
    }
    buildFallbackPortfolioAnalysis(holdings, summary, diversificationScore) {
        const pnl = summary?.totalPnlPercent ?? 0;
        const score = Math.min(100, Math.max(0, 50 + pnl * 2 + diversificationScore * 0.3));
        const health = score >= 75 ? 'excellent' : score >= 55 ? 'good' : score >= 35 ? 'fair' : 'poor';
        return {
            overallHealth: health,
            score: Math.round(score),
            summary: `Your portfolio of ${holdings.length} stocks has a total P&L of ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%. ${diversificationScore > 60 ? 'Good diversification across holdings.' : 'Consider diversifying further.'}`,
            strengths: [
                holdings.length > 3 ? 'Multiple holdings reduce single-stock risk' : 'Active portfolio management',
                pnl > 0 ? `Positive overall return of +${pnl.toFixed(2)}%` : 'Positions established for future growth',
            ],
            risks: [
                diversificationScore < 40 ? 'High concentration in few stocks' : 'Monitor sector concentration',
                'Market volatility may impact short-term performance',
            ],
            suggestions: [
                'Review underperforming positions quarterly',
                'Consider adding defensive stocks for balance',
                'Set stop-loss levels to protect gains',
            ],
            diversificationScore,
            riskLevel: diversificationScore < 30 ? 'high' : diversificationScore < 60 ? 'medium' : 'low',
        };
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        gse_service_1.GseService,
        prompt_guard_service_1.PromptGuardService,
        context_builder_service_1.ContextBuilderService,
        rate_limiter_service_1.RateLimiterService,
        circuit_breaker_service_1.CircuitBreakerService,
        conversation_store_service_1.ConversationStoreService,
        disclaimer_engine_service_1.DisclaimerEngineService,
        audit_logger_service_1.AuditLoggerService])
], AiService);
class RateLimitExceededError extends Error {
    constructor(rateLimitInfo) {
        const limitType = rateLimitInfo.limitExceeded === 'hourly' ? 'hourly' : 'daily';
        const limit = limitType === 'hourly' ? 30 : 100;
        super(`You've reached the ${limitType} limit of ${limit} AI requests. Try again in ${rateLimitInfo.resetInSeconds}s.`);
        this.rateLimitInfo = rateLimitInfo;
        this.name = 'RateLimitExceededError';
    }
}
exports.RateLimitExceededError = RateLimitExceededError;
//# sourceMappingURL=ai.service.js.map
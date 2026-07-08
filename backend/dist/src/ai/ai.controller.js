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
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const ai_service_1 = require("./ai.service");
const conversation_store_service_1 = require("./services/conversation-store.service");
const insight_generator_service_1 = require("./services/insight-generator.service");
const circuit_breaker_service_1 = require("./services/circuit-breaker.service");
const rate_limiter_service_1 = require("./services/rate-limiter.service");
const portfolio_service_1 = require("../portfolio/portfolio.service");
const chat_dto_1 = require("./dto/chat.dto");
const disclaimer_engine_service_1 = require("./services/disclaimer-engine.service");
let AiController = class AiController {
    constructor(aiService, conversationStoreService, insightGeneratorService, circuitBreakerService, rateLimiterService, portfolioService, disclaimerEngine) {
        this.aiService = aiService;
        this.conversationStoreService = conversationStoreService;
        this.insightGeneratorService = insightGeneratorService;
        this.circuitBreakerService = circuitBreakerService;
        this.rateLimiterService = rateLimiterService;
        this.portfolioService = portfolioService;
        this.disclaimerEngine = disclaimerEngine;
    }
    async sendMessage(dto, req) {
        const userId = req.user.id || req.user.sub;
        if (dto.conversationId) {
            const existing = await this.conversationStoreService.getConversation(dto.conversationId, userId);
            if (!existing) {
                throw new common_1.NotFoundException('Conversation not found');
            }
        }
        return this.aiService.chat(userId, dto.message, dto.conversationId);
    }
    async createConversation(req) {
        const userId = req.user.id || req.user.sub;
        const conversation = await this.conversationStoreService.createConversation(userId);
        return conversation;
    }
    async listConversations(req) {
        const userId = req.user.id || req.user.sub;
        const conversations = await this.conversationStoreService.listConversations(userId);
        return { conversations };
    }
    async getConversation(id, req) {
        const userId = req.user.id || req.user.sub;
        const conversation = await this.conversationStoreService.getConversation(id, userId);
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        const messages = await this.conversationStoreService.getMessages(id);
        return {
            ...conversation,
            messages,
        };
    }
    async deleteConversation(id, req) {
        const userId = req.user.id || req.user.sub;
        const conversation = await this.conversationStoreService.getConversation(id, userId);
        if (!conversation) {
            throw new common_1.NotFoundException('Conversation not found');
        }
        await this.conversationStoreService.deleteConversation(id, userId);
    }
    async getInsights(req) {
        const userId = req.user.id || req.user.sub;
        let holdings = [];
        try {
            const portfolio = await this.portfolioService.getUserPortfolio(userId);
            holdings = portfolio.holdings || [];
        }
        catch {
        }
        const insights = await this.insightGeneratorService.getInsights(userId, holdings);
        return { insights: insights || [] };
    }
    async getStatus() {
        const state = await this.circuitBreakerService.getState();
        return state;
    }
    async getRateLimit(req) {
        const userId = req.user.id || req.user.sub;
        const rateLimitInfo = await this.rateLimiterService.getRateLimitStatus(userId);
        return rateLimitInfo;
    }
    async legacyChat(dto, req) {
        const reply = await this.aiService.legacyChat(dto.message, dto.history || [], req.user.id);
        return { reply };
    }
    async getStockInsight(symbol) {
        return this.aiService.getStockInsight(symbol.toUpperCase());
    }
    async getSentiment(symbol, dto) {
        return this.aiService.getNewsSentiment(symbol.toUpperCase(), dto.headlines);
    }
    async analyzePortfolio(req) {
        const portfolio = await this.portfolioService.getUserPortfolio(req.user.id);
        return this.aiService.analyzePortfolio(portfolio.holdings, portfolio.summary);
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('chat'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Send a message to the AI trading assistant' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'AI response with disclaimer', type: chat_dto_1.ChatResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Rate limit exceeded' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chat_dto_1.SendMessageDto, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('conversations'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new AI conversation thread' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Conversation created successfully' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "createConversation", null);
__decorate([
    (0, common_1.Get)('conversations'),
    (0, swagger_1.ApiOperation)({ summary: "List user's AI conversations" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of conversations sorted by most recent' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "listConversations", null);
__decorate([
    (0, common_1.Get)('conversations/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get full conversation history' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Conversation UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Conversation with full message history' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Conversation not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getConversation", null);
__decorate([
    (0, common_1.Delete)('conversations/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a conversation (soft-delete)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Conversation UUID' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Conversation deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Conversation not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "deleteConversation", null);
__decorate([
    (0, common_1.Get)('insights'),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI-generated dashboard insight cards' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Array of insight cards or null if unavailable' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getInsights", null);
__decorate([
    (0, common_1.Get)('status'),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI service status and circuit breaker state' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current circuit breaker state' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Get)('rate-limit'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current rate limit status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Current rate limit info for the user' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getRateLimit", null);
__decorate([
    (0, common_1.Post)('legacy-chat'),
    (0, swagger_1.ApiOperation)({ summary: '[Legacy] Chat with AI trading assistant' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chat_dto_1.ChatDto, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "legacyChat", null);
__decorate([
    (0, common_1.Get)('insights/:symbol'),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI insight for a specific stock' }),
    (0, swagger_1.ApiParam)({ name: 'symbol', description: 'Stock symbol (e.g., MTNGH)' }),
    __param(0, (0, common_1.Param)('symbol')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getStockInsight", null);
__decorate([
    (0, common_1.Post)('sentiment/:symbol'),
    (0, swagger_1.ApiOperation)({ summary: 'Analyze news sentiment for a symbol' }),
    (0, swagger_1.ApiParam)({ name: 'symbol', description: 'Stock symbol (e.g., MTNGH)' }),
    __param(0, (0, common_1.Param)('symbol')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, chat_dto_1.SentimentDto]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "getSentiment", null);
__decorate([
    (0, common_1.Get)('portfolio-analysis'),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI analysis of user portfolio' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "analyzePortfolio", null);
exports.AiController = AiController = __decorate([
    (0, swagger_1.ApiTags)('AI'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [ai_service_1.AiService,
        conversation_store_service_1.ConversationStoreService,
        insight_generator_service_1.InsightGeneratorService,
        circuit_breaker_service_1.CircuitBreakerService,
        rate_limiter_service_1.RateLimiterService,
        portfolio_service_1.PortfolioService,
        disclaimer_engine_service_1.DisclaimerEngineService])
], AiController);
//# sourceMappingURL=ai.controller.js.map
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
exports.NewsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const news_service_1 = require("./news.service");
const news_aggregator_service_1 = require("./news-aggregator.service");
const create_news_dto_1 = require("./dto/create-news.dto");
const create_comment_dto_1 = require("./dto/create-comment.dto");
const create_reaction_dto_1 = require("./dto/create-reaction.dto");
let NewsController = class NewsController {
    constructor(newsService, newsAggregator) {
        this.newsService = newsService;
        this.newsAggregator = newsAggregator;
    }
    async createNews(createNewsDto, req) {
        return this.newsService.createNews(createNewsDto, req.user.userId);
    }
    async getAllNews(category, symbol, limit, offset) {
        return this.newsAggregator.getAllNews({ category, symbol, limit, offset });
    }
    async getTrendingNews(limit) {
        return this.newsAggregator.getTrendingNews(limit);
    }
    async getNewsById(id) {
        return this.newsService.getNewsById(id);
    }
    async deleteNews(id, req) {
        return this.newsService.deleteNews(id, req.user.userId);
    }
    async createComment(newsId, createCommentDto, req) {
        return this.newsService.createComment(newsId, req.user.userId, createCommentDto);
    }
    async getComments(newsId, limit, offset) {
        return this.newsService.getComments(newsId, { limit, offset });
    }
    async getReplies(commentId) {
        return this.newsService.getReplies(commentId);
    }
    async deleteComment(commentId, req) {
        return this.newsService.deleteComment(commentId, req.user.userId);
    }
    async toggleReaction(newsId, createReactionDto, req) {
        return this.newsService.toggleReaction(newsId, req.user.userId, createReactionDto);
    }
    async getReactions(newsId) {
        return this.newsService.getReactionsByNews(newsId);
    }
    async getUserReaction(newsId, req) {
        return this.newsService.getUserReaction(newsId, req.user.userId);
    }
};
exports.NewsController = NewsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create news article' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'News created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_news_dto_1.CreateNewsDto, Object]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "createNews", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all news with pagination and filters' }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'symbol', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, type: Number }),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('symbol')),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __param(3, (0, common_1.Query)('offset', new common_1.DefaultValuePipe(0), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "getAllNews", null);
__decorate([
    (0, common_1.Get)('trending'),
    (0, swagger_1.ApiOperation)({ summary: 'Get trending news' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(10), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "getTrendingNews", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get news by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'News found' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'News not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "getNewsById", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete news article' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'News deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - not the author' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'News not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "deleteNews", null);
__decorate([
    (0, common_1.Post)(':id/comments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add comment to news' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Comment created successfully' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_comment_dto_1.CreateCommentDto, Object]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "createComment", null);
__decorate([
    (0, common_1.Get)(':id/comments'),
    (0, swagger_1.ApiOperation)({ summary: 'Get comments for news' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'offset', required: false, type: Number }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('offset', new common_1.DefaultValuePipe(0), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "getComments", null);
__decorate([
    (0, common_1.Get)('comments/:commentId/replies'),
    (0, swagger_1.ApiOperation)({ summary: 'Get replies to a comment' }),
    __param(0, (0, common_1.Param)('commentId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "getReplies", null);
__decorate([
    (0, common_1.Delete)('comments/:commentId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete comment' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Comment deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - not the author' }),
    __param(0, (0, common_1.Param)('commentId', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "deleteComment", null);
__decorate([
    (0, common_1.Post)(':id/reactions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Toggle reaction on news' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Reaction toggled successfully' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_reaction_dto_1.CreateReactionDto, Object]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "toggleReaction", null);
__decorate([
    (0, common_1.Get)(':id/reactions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get reactions for news' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "getReactions", null);
__decorate([
    (0, common_1.Get)(':id/reactions/me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user reaction for news' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NewsController.prototype, "getUserReaction", null);
exports.NewsController = NewsController = __decorate([
    (0, swagger_1.ApiTags)('news'),
    (0, common_1.Controller)('news'),
    __metadata("design:paramtypes", [news_service_1.NewsService,
        news_aggregator_service_1.NewsAggregatorService])
], NewsController);
//# sourceMappingURL=news.controller.js.map
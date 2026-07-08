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
var AiRateLimitGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiRateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
const rate_limiter_service_1 = require("../services/rate-limiter.service");
let AiRateLimitGuard = AiRateLimitGuard_1 = class AiRateLimitGuard {
    constructor(rateLimiterService) {
        this.rateLimiterService = rateLimiterService;
        this.logger = new common_1.Logger(AiRateLimitGuard_1.name);
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.id) {
            return true;
        }
        const userId = user.id;
        const rateLimitInfo = await this.rateLimiterService.checkLimit(userId);
        if (rateLimitInfo.limitExceeded) {
            const message = rateLimitInfo.limitExceeded === 'hourly'
                ? `You've reached the hourly limit of 30 AI requests. Try again in ${rateLimitInfo.resetInSeconds}s.`
                : `You've reached the daily limit of 100 AI requests. Try again in ${rateLimitInfo.resetInSeconds}s.`;
            this.logger.warn(`Rate limit exceeded for user ${userId}: ${rateLimitInfo.limitExceeded} (reset in ${rateLimitInfo.resetInSeconds}s)`);
            throw new common_1.HttpException({
                statusCode: common_1.HttpStatus.TOO_MANY_REQUESTS,
                message,
                rateLimitInfo,
            }, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        return true;
    }
};
exports.AiRateLimitGuard = AiRateLimitGuard;
exports.AiRateLimitGuard = AiRateLimitGuard = AiRateLimitGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rate_limiter_service_1.RateLimiterService])
], AiRateLimitGuard);
//# sourceMappingURL=ai-rate-limit.guard.js.map
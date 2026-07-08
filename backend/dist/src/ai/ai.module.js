"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ai_controller_1 = require("./ai.controller");
const ai_service_1 = require("./ai.service");
const gse_module_1 = require("../gse/gse.module");
const portfolio_module_1 = require("../portfolio/portfolio.module");
const news_module_1 = require("../news/news.module");
const prompt_guard_service_1 = require("./services/prompt-guard.service");
const context_builder_service_1 = require("./services/context-builder.service");
const rate_limiter_service_1 = require("./services/rate-limiter.service");
const circuit_breaker_service_1 = require("./services/circuit-breaker.service");
const conversation_store_service_1 = require("./services/conversation-store.service");
const disclaimer_engine_service_1 = require("./services/disclaimer-engine.service");
const insight_generator_service_1 = require("./services/insight-generator.service");
const audit_logger_service_1 = require("./services/audit-logger.service");
const ai_rate_limit_guard_1 = require("./guards/ai-rate-limit.guard");
let AiModule = class AiModule {
};
exports.AiModule = AiModule;
exports.AiModule = AiModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            gse_module_1.GseModule,
            portfolio_module_1.PortfolioModule,
            news_module_1.NewsModule,
        ],
        controllers: [ai_controller_1.AiController],
        providers: [
            ai_service_1.AiService,
            prompt_guard_service_1.PromptGuardService,
            context_builder_service_1.ContextBuilderService,
            rate_limiter_service_1.RateLimiterService,
            circuit_breaker_service_1.CircuitBreakerService,
            conversation_store_service_1.ConversationStoreService,
            disclaimer_engine_service_1.DisclaimerEngineService,
            insight_generator_service_1.InsightGeneratorService,
            audit_logger_service_1.AuditLoggerService,
            ai_rate_limit_guard_1.AiRateLimitGuard,
        ],
        exports: [
            ai_service_1.AiService,
            prompt_guard_service_1.PromptGuardService,
            context_builder_service_1.ContextBuilderService,
            rate_limiter_service_1.RateLimiterService,
            circuit_breaker_service_1.CircuitBreakerService,
            conversation_store_service_1.ConversationStoreService,
            disclaimer_engine_service_1.DisclaimerEngineService,
            insight_generator_service_1.InsightGeneratorService,
            audit_logger_service_1.AuditLoggerService,
        ],
    })
], AiModule);
//# sourceMappingURL=ai.module.js.map
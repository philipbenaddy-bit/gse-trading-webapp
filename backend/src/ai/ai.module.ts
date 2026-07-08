import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GseModule } from '../gse/gse.module';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { NewsModule } from '../news/news.module';
import { PromptGuardService } from './services/prompt-guard.service';
import { ContextBuilderService } from './services/context-builder.service';
import { RateLimiterService } from './services/rate-limiter.service';
import { CircuitBreakerService } from './services/circuit-breaker.service';
import { ConversationStoreService } from './services/conversation-store.service';
import { DisclaimerEngineService } from './services/disclaimer-engine.service';
import { InsightGeneratorService } from './services/insight-generator.service';
import { AuditLoggerService } from './services/audit-logger.service';
import { AiRateLimitGuard } from './guards/ai-rate-limit.guard';

@Module({
  imports: [
    ConfigModule,
    GseModule,
    PortfolioModule,
    NewsModule,
  ],
  controllers: [AiController],
  providers: [
    // Core orchestrator
    AiService,

    // Security layer
    PromptGuardService,

    // Context assembly
    ContextBuilderService,

    // Rate limiting & circuit breaker
    RateLimiterService,
    CircuitBreakerService,

    // Conversation persistence
    ConversationStoreService,

    // Response processing
    DisclaimerEngineService,

    // Dashboard insights
    InsightGeneratorService,

    // Audit & compliance
    AuditLoggerService,

    // Guards
    AiRateLimitGuard,
  ],
  exports: [
    AiService,
    PromptGuardService,
    ContextBuilderService,
    RateLimiterService,
    CircuitBreakerService,
    ConversationStoreService,
    DisclaimerEngineService,
    InsightGeneratorService,
    AuditLoggerService,
  ],
})
export class AiModule {}

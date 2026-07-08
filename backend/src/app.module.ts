import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MarketModule } from './market/market.module';
import { OrdersModule } from './orders/orders.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { WalletModule } from './wallet/wallet.module';
import { GseModule } from './gse/gse.module';
import { NewsModule } from './news/news.module';
import { AiModule } from './ai/ai.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({ isGlobal: true }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Cron jobs
    ScheduleModule.forRoot(),

    // Supabase (replaces TypeORM due to network restrictions)
    SupabaseModule,

    // Feature modules
    AuthModule,
    UsersModule,
    MarketModule,
    OrdersModule,
    PortfolioModule,
    WalletModule,
    GseModule,
    NewsModule,
    AiModule,
    AnalyticsModule,
  ],
})
export class AppModule {}

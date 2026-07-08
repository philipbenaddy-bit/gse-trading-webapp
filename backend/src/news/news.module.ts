import { Module } from '@nestjs/common';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { NewsAggregatorService } from './news-aggregator.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [NewsController],
  providers: [NewsService, NewsAggregatorService],
  exports: [NewsService, NewsAggregatorService],
})
export class NewsModule {}

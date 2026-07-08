import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { GseService } from '../../gse/gse.service';
import { NewsAggregatorService } from '../../news/news-aggregator.service';
import { AiService } from '../ai.service';
import { DisclaimerEngineService } from './disclaimer-engine.service';
import { InsightCard } from '../interfaces/ai.interfaces';
import {
  INSIGHT_REFRESH_THROTTLE_MS,
  INSIGHT_CACHE_EXPIRY_MS,
  INSIGHT_MAX_CARDS,
  INSIGHT_TITLE_MAX_LENGTH,
  INSIGHT_SUMMARY_MAX_LENGTH,
  INSIGHT_CONTEXT_MAX_HOLDINGS,
  INSIGHT_CONTEXT_MAX_NEWS,
} from '../constants/ai.constants';

/**
 * Insight Generator Service
 *
 * Generates up to 3 AI-powered insight cards for the dashboard based on
 * the user's portfolio holdings and current market conditions.
 *
 * Features:
 * - 4-hour refresh throttle per user (serves cached insights if fresher)
 * - 24-hour cache expiry in `ai_insights_cache` table
 * - Graceful degradation: serves cached insights on LLM failure, hides section if no cache
 * - For users with no holdings: generates insights based on GSE Composite Index + trending news
 * - Enforces format constraints: title ≤ 80 chars, summary ≤ 150 chars, relevance symbol, disclaimer
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */
@Injectable()
export class InsightGeneratorService {
  private readonly logger = new Logger(InsightGeneratorService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly gseService: GseService,
    private readonly newsAggregatorService: NewsAggregatorService,
    private readonly aiService: AiService,
    private readonly disclaimerEngine: DisclaimerEngineService,
  ) {}

  /**
   * Main method: returns insight cards for a user.
   * Serves cached insights if within the 4-hour throttle window.
   * Generates new insights if cache is stale or missing.
   * On LLM failure, serves cached insights if < 24 hours old, returns null otherwise.
   */
  async getInsights(
    userId: string,
    holdings: any[],
  ): Promise<InsightCard[] | null> {
    // Check if we should serve cached insights (4-hour throttle)
    const shouldGenerate = await this.shouldRefresh(userId);

    if (!shouldGenerate) {
      const cached = await this.getCachedInsights(userId);
      if (cached) {
        return cached;
      }
      // Cache missing but throttle says don't refresh — generate anyway
    }

    // Gather news context
    const news = await this.getRelevantNews(holdings);

    try {
      // Generate new insights via LLM
      const insights = await this.generateInsights(userId, holdings, news);

      // Cache the new insights
      await this.cacheInsights(userId, insights);

      return insights;
    } catch (error) {
      this.logger.error(
        `Failed to generate insights for user ${userId}: ${error.message}`,
      );

      // Graceful degradation: serve cached insights if < 24 hours old
      const cached = await this.getCachedInsights(userId);
      if (cached) {
        return cached;
      }

      // No valid cache — hide section
      return null;
    }
  }

  /**
   * Generates insight cards by calling the LLM with portfolio + news context.
   * For users with no holdings, uses GSE Composite Index + trending news.
   */
  async generateInsights(
    userId: string,
    holdings: any[],
    news: any[],
  ): Promise<InsightCard[]> {
    const hasHoldings = holdings && holdings.length > 0;

    // Build context for the LLM prompt
    let contextDescription: string;

    if (hasHoldings) {
      // Use top 5 holdings by portfolio value
      const topHoldings = holdings
        .sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0))
        .slice(0, INSIGHT_CONTEXT_MAX_HOLDINGS);

      const holdingsContext = topHoldings
        .map(
          (h) =>
            `${h.symbol}: ${h.quantity} shares, value GHS ${h.currentValue?.toFixed(2) || 'N/A'}, P&L: ${h.unrealizedGainLoss?.toFixed(2) || h.pnl?.toFixed(2) || '0.00'}`,
        )
        .join('\n');

      contextDescription = `User's top holdings:\n${holdingsContext}`;
    } else {
      // No holdings — use GSE Composite Index
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

    // Add news context
    const newsContext = news.length > 0
      ? `\n\nRecent news:\n${news
          .slice(0, INSIGHT_CONTEXT_MAX_NEWS)
          .map((n) => `- ${n.title} (${n.source}, ${n.relatedSymbols?.join(', ') || 'general'})`)
          .join('\n')}`
      : '';

    const prompt = `Based on the following market context, generate exactly ${INSIGHT_MAX_CARDS} brief market insight cards in JSON format.

${contextDescription}${newsContext}

Each insight card must have:
- "title": a concise headline (max ${INSIGHT_TITLE_MAX_LENGTH} characters)
- "summary": a brief explanation (max ${INSIGHT_SUMMARY_MAX_LENGTH} characters)
- "relevanceSymbol": the most relevant stock symbol or "GSE" for general market insights

Respond ONLY with a JSON array of ${INSIGHT_MAX_CARDS} objects. No other text.
Example format:
[{"title":"...","summary":"...","relevanceSymbol":"MTNGH"}]`;

    const messages = [
      {
        role: 'system' as const,
        content:
          'You are a Ghana Stock Exchange market analyst. Generate concise, factual market insight cards. Never provide investment advice. Keep titles under 80 characters and summaries under 150 characters.',
      },
      { role: 'user' as const, content: prompt },
    ];

    const response = await this.aiService.callLLM(messages, 600);

    // Parse the LLM response
    const insights = this.parseInsightsResponse(response, userId);

    return insights;
  }

  /**
   * Reads cached insights from the `ai_insights_cache` table.
   * Returns null if no cache exists or cache is expired (> 24 hours old).
   */
  async getCachedInsights(userId: string): Promise<InsightCard[] | null> {
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

      // Check if cache is expired (> 24 hours old)
      const generatedAt = new Date(data.generated_at).getTime();
      const now = Date.now();

      if (now - generatedAt > INSIGHT_CACHE_EXPIRY_MS) {
        return null;
      }

      // Return cached insights
      const insights = data.insights as InsightCard[];
      return Array.isArray(insights) ? insights : null;
    } catch (error) {
      this.logger.warn(
        `Failed to read cached insights for user ${userId}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Writes generated insights to the `ai_insights_cache` table.
   * Upserts by user_id to maintain a single cache entry per user.
   */
  async cacheInsights(userId: string, insights: InsightCard[]): Promise<void> {
    try {
      const client = this.supabaseService.getAdminClient();

      const expiresAt = new Date(
        Date.now() + INSIGHT_CACHE_EXPIRY_MS,
      ).toISOString();

      // Delete existing cache for this user, then insert new
      await client
        .from('ai_insights_cache')
        .delete()
        .eq('user_id', userId);

      const { error } = await client.from('ai_insights_cache').insert({
        user_id: userId,
        insights: insights as any,
        generated_at: new Date().toISOString(),
        expires_at: expiresAt,
      });

      if (error) {
        this.logger.warn(
          `Failed to cache insights for user ${userId}: ${error.message}`,
        );
      }
    } catch (error) {
      this.logger.warn(
        `Failed to cache insights for user ${userId}: ${error.message}`,
      );
    }
  }

  /**
   * Checks the 4-hour refresh throttle.
   * Returns true if insights should be regenerated (last generation was > 4 hours ago or no cache exists).
   */
  async shouldRefresh(userId: string): Promise<boolean> {
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
        // No cache exists — should generate
        return true;
      }

      const generatedAt = new Date(data.generated_at).getTime();
      const now = Date.now();

      // If last generation was more than 4 hours ago, refresh
      return now - generatedAt >= INSIGHT_REFRESH_THROTTLE_MS;
    } catch (error) {
      this.logger.warn(
        `Failed to check refresh throttle for user ${userId}: ${error.message}`,
      );
      // On error, allow refresh
      return true;
    }
  }

  /**
   * Gathers relevant news articles based on user holdings.
   * For users with holdings: matches news by relatedSymbols.
   * For users without holdings: returns trending news.
   */
  private async getRelevantNews(holdings: any[]): Promise<any[]> {
    try {
      if (holdings && holdings.length > 0) {
        // Get symbols from top holdings
        const topHoldings = holdings
          .sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0))
          .slice(0, INSIGHT_CONTEXT_MAX_HOLDINGS);

        const symbols = topHoldings
          .map((h) => h.symbol)
          .filter(Boolean);

        // Fetch news matching user's holding symbols
        const allNews: any[] = [];
        for (const symbol of symbols) {
          const { data } = await this.newsAggregatorService.getAllNews({
            symbol,
            limit: INSIGHT_CONTEXT_MAX_NEWS,
          });
          allNews.push(...data);
        }

        // Deduplicate by id and limit to max news count
        const uniqueNews = Array.from(
          new Map(allNews.map((n) => [n.id, n])).values(),
        ).slice(0, INSIGHT_CONTEXT_MAX_NEWS);

        return uniqueNews;
      } else {
        // No holdings — use trending news
        const trending =
          await this.newsAggregatorService.getTrendingNews(
            INSIGHT_CONTEXT_MAX_NEWS,
          );
        return trending;
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch news for insights: ${error.message}`);
      return [];
    }
  }

  /**
   * Parses the LLM JSON response into InsightCard[] with format enforcement.
   * Truncates title/summary to max lengths, adds disclaimer and metadata.
   */
  private parseInsightsResponse(
    response: string,
    userId: string,
  ): InsightCard[] {
    try {
      // Extract JSON array from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        this.logger.warn('No JSON array found in LLM insight response');
        return this.generateFallbackInsights(userId);
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(parsed)) {
        return this.generateFallbackInsights(userId);
      }

      const insights: InsightCard[] = parsed
        .slice(0, INSIGHT_MAX_CARDS)
        .map((item: any, index: number) => ({
          id: `insight-${userId}-${Date.now()}-${index}`,
          title: this.truncate(
            item.title || 'Market Update',
            INSIGHT_TITLE_MAX_LENGTH,
          ),
          summary: this.truncate(
            item.summary || 'Check the latest market developments.',
            INSIGHT_SUMMARY_MAX_LENGTH,
          ),
          relevanceSymbol: item.relevanceSymbol || 'GSE',
          disclaimer: this.disclaimerEngine.getDisclaimer(),
          generatedAt: new Date().toISOString(),
        }));

      return insights;
    } catch (error) {
      this.logger.warn(
        `Failed to parse LLM insight response: ${error.message}`,
      );
      return this.generateFallbackInsights(userId);
    }
  }

  /**
   * Generates fallback insight cards when LLM parsing fails.
   * Uses basic market data to create generic insights.
   */
  private generateFallbackInsights(userId: string): InsightCard[] {
    const liveStocks = this.gseService.getAllLive();
    const topMover = liveStocks.sort(
      (a, b) => Math.abs(b.change) - Math.abs(a.change),
    )[0];

    const insights: InsightCard[] = [
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
        summary: this.truncate(
          `${topMover.name} moved ${topMover.change >= 0 ? '+' : ''}${topMover.change} today at GHS ${topMover.price}. Review fundamentals before acting.`,
          INSIGHT_SUMMARY_MAX_LENGTH,
        ),
        relevanceSymbol: topMover.name,
        disclaimer: this.disclaimerEngine.getDisclaimer(),
        generatedAt: new Date().toISOString(),
      });
    }

    return insights.slice(0, INSIGHT_MAX_CARDS);
  }

  /**
   * Truncates a string to the specified max length.
   */
  private truncate(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}

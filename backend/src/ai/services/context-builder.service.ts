import { Injectable, Logger } from '@nestjs/common';
import { GseService, GseLiveStock } from '../../gse/gse.service';
import { PortfolioService } from '../../portfolio/portfolio.service';
import {
  NewsAggregatorService,
  NewsArticle,
} from '../../news/news-aggregator.service';
import {
  MarketDataContext,
  NewsDataContext,
  PortfolioDataContext,
} from '../interfaces/ai.interfaces';
import {
  DATA_FRESHNESS_THRESHOLD_MS,
  DATA_SOURCE_TIMEOUT_MS,
  NEWS_RECENCY_DAYS,
  NEWS_STOCK_QUERY_MAX_ARTICLES,
  NEWS_SUMMARY_MAX_LENGTH,
  NEWS_TRENDING_MAX_ARTICLES,
  PORTFOLIO_CONTEXT_MAX_HOLDINGS,
} from '../constants/ai.constants';

/**
 * Known GSE stock symbols mapped to their common company names.
 * Used for matching user messages to stock symbols.
 */
export const GSE_SYMBOL_MAP: Record<string, string[]> = {
  MTNGH: ['mtn ghana', 'mtn', 'mtngh'],
  GCB: ['gcb bank', 'gcb', 'ghana commercial bank'],
  GOIL: ['goil', 'ghana oil'],
  CAL: ['calbank', 'cal bank', 'cal'],
  EGH: ['ecobank ghana', 'ecobank', 'egh'],
  SCB: ['standard chartered', 'standard chartered bank', 'scb', 'stanchart'],
  TOTAL: ['totalenergies', 'total', 'total energies'],
  FML: ['fan milk', 'fan milk limited', 'fml'],
  BOPP: ['benso oil palm', 'bopp', 'benso'],
  SIC: ['sic insurance', 'sic'],
  SOGEGH: ['societe generale', 'sogegh', 'soge'],
  ETI: ['ecobank transnational', 'eti'],
  DASPHARMA: ['das pharma', 'daspharma'],
  AYRTN: ['ayrton', 'ayrtn', 'ayrton drug'],
  CLYD: ['clydestone', 'clyd'],
  CMLT: ['camelot', 'cmlt'],
  CPC: ['cocoa processing', 'cpc', 'cocoa processing company'],
  DIGICUT: ['digicut', 'digi cut'],
  EGL: ['enterprise group', 'egl', 'enterprise'],
  GLD: ['guinness', 'gld', 'guinness ghana'],
  GWEB: ['golden web', 'gweb'],
  MLC: ['mechanical lloyd', 'mlc', 'mechanical lloyd company'],
  PBC: ['produce buying company', 'pbc'],
  PZC: ['pz cussons', 'pzc', 'pz cussons ghana'],
  RBGH: ['republic bank', 'rbgh', 'republic bank ghana'],
  SWL: ['sam woode', 'swl', 'sam woode limited'],
  TRANSOL: ['transaction solutions', 'transol'],
  UNIL: ['unilever', 'unil', 'unilever ghana'],
  ACCESS: ['access bank', 'access'],
  ADB: ['agricultural development bank', 'adb'],
  ALW: ['aluworks', 'alw'],
  GGBL: ['guinness ghana breweries', 'ggbl'],
  MAC: ['mega african capital', 'mac'],
  MTNGH_ETF: ['mtn ghana etf'],
  NEWGOLD: ['newgold', 'new gold'],
  SPL: ['starlife', 'spl', 'starlife assurance'],
  TLW: ['tullow', 'tlw', 'tullow oil'],
};

@Injectable()
export class ContextBuilderService {
  private readonly logger = new Logger(ContextBuilderService.name);

  constructor(
    private readonly gseService: GseService,
    private readonly portfolioService: PortfolioService,
    private readonly newsAggregatorService: NewsAggregatorService,
  ) {}

  /**
   * Builds market data context from the user's message.
   * Extracts stock symbols, retrieves cached market data, and assembles context.
   *
   * @param message - The user's chat message
   * @returns MarketDataContext with matched stock data, composite index, gainers/losers
   */
  async buildMarketContext(
    message: string,
  ): Promise<MarketDataContext | undefined> {
    try {
      const allLiveStocks = this.gseService.getAllLive();

      // If no market data is available at all, return undefined
      if (!allLiveStocks || allLiveStocks.length === 0) {
        this.logger.warn('No market data available in GseService cache');
        return undefined;
      }

      const matchedSymbols = this.extractStockSymbols(message);
      const lastUpdated = this.gseService.getLastUpdated();

      // Build requested stock context
      let requestedStock: MarketDataContext['requestedStock'] | undefined;
      if (matchedSymbols.length > 0) {
        // Use the first matched symbol as the primary requested stock
        const primarySymbol = matchedSymbols[0];
        const liveData = this.gseService.getLiveBySymbol(primarySymbol);

        if (liveData) {
          requestedStock = {
            symbol: primarySymbol,
            price: liveData.price,
            changePercent: liveData.change,
            volume: liveData.volume,
          };
        }
      }

      // Calculate composite index (average of all stock prices weighted by volume)
      const compositeIndex = this.calculateCompositeIndex(allLiveStocks);

      // Get top 5 gainers and top 5 losers by daily change percentage
      const { topGainers, topLosers } =
        this.getTopGainersAndLosers(allLiveStocks);

      // Determine data freshness
      const lastUpdatedStr = lastUpdated
        ? lastUpdated.toISOString()
        : new Date(0).toISOString();

      const context: MarketDataContext = {
        topGainers,
        topLosers,
        lastUpdated: lastUpdatedStr,
      };

      if (requestedStock) {
        context.requestedStock = requestedStock;
      }

      if (compositeIndex !== undefined) {
        context.compositeIndex = compositeIndex;
      }

      // Add freshness warning if data is older than 30 minutes
      if (lastUpdated) {
        const ageMs = Date.now() - lastUpdated.getTime();
        if (ageMs > DATA_FRESHNESS_THRESHOLD_MS) {
          // lastUpdated is already included; the caller can use it to display freshness info
          this.logger.debug(
            `Market data is ${Math.round(ageMs / 60000)} minutes old`,
          );
        }
      }

      return context;
    } catch (error) {
      this.logger.error('Failed to build market context', error?.message);
      return undefined;
    }
  }

  /**
   * Builds portfolio data context for the authenticated user.
   * Enforces KYC gate: returns undefined for non-KYC-verified users.
   * Returns up to 20 holdings sorted by current value descending.
   *
   * @param userId - The authenticated user's ID
   * @param isKycVerified - Whether the user has completed KYC verification
   * @returns PortfolioDataContext with holdings, totalValue, totalPnl, or undefined
   */
  async buildPortfolioContext(
    userId: string,
    isKycVerified: boolean,
  ): Promise<PortfolioDataContext | undefined> {
    // KYC gate: exclude portfolio data for non-KYC-verified users
    if (!isKycVerified) {
      this.logger.debug(
        `Portfolio context excluded for user ${userId}: KYC not verified`,
      );
      return undefined;
    }

    try {
      // Retrieve portfolio data with timeout
      const portfolioPromise = this.portfolioService.getUserPortfolio(userId);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Portfolio data retrieval timed out')),
          DATA_SOURCE_TIMEOUT_MS,
        ),
      );

      const portfolio = await Promise.race([portfolioPromise, timeoutPromise]);

      // Handle empty portfolio case
      if (!portfolio.holdings || portfolio.holdings.length === 0) {
        this.logger.debug(
          `Portfolio context omitted for user ${userId}: no holdings`,
        );
        return undefined;
      }

      // Sort holdings by current value descending and cap at max holdings
      const sortedHoldings = [...portfolio.holdings]
        .sort((a, b) => b.currentValue - a.currentValue)
        .slice(0, PORTFOLIO_CONTEXT_MAX_HOLDINGS);

      // Map to PortfolioDataContext holdings format
      const holdings = sortedHoldings.map((h) => ({
        symbol: h.symbol,
        quantity: h.quantity,
        averageCost: Number(h.averageCost),
        currentValue: h.currentValue,
        unrealizedGainLoss: h.pnl,
      }));

      return {
        holdings,
        totalValue: portfolio.summary.totalValue,
        totalPnl: portfolio.summary.totalPnl,
      };
    } catch (error) {
      this.logger.error(
        `Failed to build portfolio context for user ${userId}`,
        error?.message,
      );
      return undefined;
    }
  }

  /**
   * Builds news data context for the AI prompt.
   * For stock queries (symbols provided): retrieves up to 3 articles matching
   * the stock symbol via relatedSymbols, filtered to the last 7 days.
   * For sentiment queries (no symbols): retrieves up to 5 trending headlines
   * sorted by view count descending.
   * Article summaries are truncated to 200 characters.
   *
   * @param symbols - Array of stock symbols extracted from the user's message
   * @param isSentimentQuery - Whether this is a sentiment/market trend query
   * @returns NewsDataContext with articles, or undefined on failure/unavailability
   */
  async buildNewsContext(
    symbols: string[],
    isSentimentQuery: boolean,
  ): Promise<NewsDataContext | undefined> {
    try {
      const newsPromise = this.fetchNewsArticles(symbols, isSentimentQuery);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('News data retrieval timed out')),
          DATA_SOURCE_TIMEOUT_MS,
        ),
      );

      const articles = await Promise.race([newsPromise, timeoutPromise]);

      if (!articles || articles.length === 0) {
        this.logger.debug('No news articles found for context');
        return undefined;
      }

      // Map articles to NewsDataContext format with truncated summaries
      const contextArticles = articles.map((article) => ({
        title: article.title,
        summary: this.truncateSummary(article.summary),
        source: article.source,
        publishedAt: article.createdAt,
        relatedSymbols: article.relatedSymbols || [],
      }));

      return { articles: contextArticles };
    } catch (error) {
      this.logger.error('Failed to build news context', error?.message);
      return undefined;
    }
  }

  /**
   * Fetches news articles based on query type.
   * Stock queries: filters by relatedSymbols match and 7-day recency.
   * Sentiment queries: gets trending articles by view count.
   */
  private async fetchNewsArticles(
    symbols: string[],
    isSentimentQuery: boolean,
  ): Promise<NewsArticle[]> {
    if (symbols.length > 0 && !isSentimentQuery) {
      // Stock-specific query: filter by symbol and recency
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - NEWS_RECENCY_DAYS);

      const results: NewsArticle[] = [];

      for (const symbol of symbols) {
        const { data } = await this.newsAggregatorService.getAllNews({
          symbol,
          limit: NEWS_STOCK_QUERY_MAX_ARTICLES * 2, // fetch extra to filter by date
        });

        // Filter by recency (within last 7 days)
        const recentArticles = data.filter((article) => {
          const articleDate = new Date(article.createdAt);
          return articleDate >= sevenDaysAgo;
        });

        results.push(...recentArticles);
      }

      // Deduplicate by article ID and limit to max articles
      const uniqueArticles = this.deduplicateArticles(results);
      return uniqueArticles.slice(0, NEWS_STOCK_QUERY_MAX_ARTICLES);
    } else {
      // Sentiment/trending query: get trending articles by view count
      const trendingArticles =
        await this.newsAggregatorService.getTrendingNews(
          NEWS_TRENDING_MAX_ARTICLES,
        );
      return trendingArticles;
    }
  }

  /**
   * Truncates a summary string to the maximum allowed length.
   * Appends ellipsis if truncated.
   */
  private truncateSummary(summary: string): string {
    if (!summary) return '';
    if (summary.length <= NEWS_SUMMARY_MAX_LENGTH) return summary;
    return summary.substring(0, NEWS_SUMMARY_MAX_LENGTH - 3) + '...';
  }

  /**
   * Deduplicates articles by their ID.
   */
  private deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    return articles.filter((article) => {
      if (seen.has(article.id)) return false;
      seen.add(article.id);
      return true;
    });
  }

  /**
   * Extracts recognized GSE stock symbols from a user message.
   * Matches against known stock symbols and company names (case-insensitive).
   *
   * @param message - The user's chat message
   * @returns Array of matched stock symbols (uppercase)
   */
  extractStockSymbols(message: string): string[] {
    if (!message || typeof message !== 'string') {
      return [];
    }

    const lowerMessage = message.toLowerCase();
    const matchedSymbols: Set<string> = new Set();

    // Also check against symbols present in the live cache
    const liveStocks = this.gseService.getAllLive();
    const liveCacheSymbols = liveStocks.map((s) => s.name.toUpperCase());

    for (const [symbol, aliases] of Object.entries(GSE_SYMBOL_MAP)) {
      // Check if the symbol itself appears in the message (word boundary match)
      const symbolLower = symbol.toLowerCase();
      if (this.matchesWordBoundary(lowerMessage, symbolLower)) {
        matchedSymbols.add(symbol);
        continue;
      }

      // Check aliases (company names) with word boundary matching
      for (const alias of aliases) {
        if (this.matchesWordBoundary(lowerMessage, alias)) {
          matchedSymbols.add(symbol);
          break;
        }
      }
    }

    // Also match against any live cache symbols not in our static map
    for (const cacheSymbol of liveCacheSymbols) {
      if (!matchedSymbols.has(cacheSymbol)) {
        const symbolLower = cacheSymbol.toLowerCase();
        if (this.matchesWordBoundary(lowerMessage, symbolLower)) {
          matchedSymbols.add(cacheSymbol);
        }
      }
    }

    return Array.from(matchedSymbols);
  }

  /**
   * Checks if a term appears in the text with word boundary matching.
   * Prevents partial matches (e.g., "cal" shouldn't match "local").
   */
  private matchesWordBoundary(text: string, term: string): boolean {
    // Use regex word boundary for symbol matching
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(text);
  }

  /**
   * Calculates the GSE Composite Index from live stock data.
   * Uses a simple average of all stock prices as a proxy for the composite index.
   * In production, this would use the actual GSE-CI calculation methodology.
   */
  private calculateCompositeIndex(
    stocks: GseLiveStock[],
  ): number | undefined {
    if (!stocks || stocks.length === 0) {
      return undefined;
    }

    // Sum all prices as a simple composite index proxy
    const totalPrice = stocks.reduce((sum, stock) => sum + stock.price, 0);
    return Math.round((totalPrice / stocks.length) * 100) / 100;
  }

  /**
   * Gets the top 5 gainers and top 5 losers by daily change percentage.
   */
  private getTopGainersAndLosers(stocks: GseLiveStock[]): {
    topGainers: { symbol: string; changePercent: number }[];
    topLosers: { symbol: string; changePercent: number }[];
  } {
    if (!stocks || stocks.length === 0) {
      return { topGainers: [], topLosers: [] };
    }

    // Sort by change percentage descending for gainers
    const sorted = [...stocks].sort((a, b) => b.change - a.change);

    const topGainers = sorted.slice(0, 5).map((s) => ({
      symbol: s.name.toUpperCase(),
      changePercent: s.change,
    }));

    // Bottom 5 for losers (ascending order)
    const topLosers = sorted
      .slice(-5)
      .reverse()
      .map((s) => ({
        symbol: s.name.toUpperCase(),
        changePercent: s.change,
      }));

    return { topGainers, topLosers };
  }
}

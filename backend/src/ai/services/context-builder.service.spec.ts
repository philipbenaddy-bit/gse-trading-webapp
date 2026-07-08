import { Test, TestingModule } from '@nestjs/testing';
import { ContextBuilderService, GSE_SYMBOL_MAP } from './context-builder.service';
import { GseService, GseLiveStock } from '../../gse/gse.service';
import { PortfolioService } from '../../portfolio/portfolio.service';
import { NewsAggregatorService, NewsArticle } from '../../news/news-aggregator.service';

describe('ContextBuilderService', () => {
  let service: ContextBuilderService;
  let gseService: jest.Mocked<Partial<GseService>>;
  let portfolioService: jest.Mocked<Partial<PortfolioService>>;
  let newsAggregatorService: jest.Mocked<Partial<NewsAggregatorService>>;

  const mockLiveStocks: GseLiveStock[] = [
    { name: 'MTNGH', price: 1.5, change: 3.2, volume: 150000 },
    { name: 'GCB', price: 5.0, change: 2.1, volume: 80000 },
    { name: 'GOIL', price: 1.8, change: -1.5, volume: 60000 },
    { name: 'CAL', price: 0.9, change: 1.0, volume: 45000 },
    { name: 'EGH', price: 7.2, change: -2.3, volume: 30000 },
    { name: 'SCB', price: 22.0, change: 0.5, volume: 10000 },
    { name: 'TOTAL', price: 4.5, change: -0.8, volume: 25000 },
    { name: 'FML', price: 3.0, change: 4.5, volume: 55000 },
    { name: 'BOPP', price: 6.0, change: -3.1, volume: 12000 },
    { name: 'SIC', price: 0.1, change: 0.0, volume: 5000 },
  ];

  beforeEach(async () => {
    gseService = {
      getAllLive: jest.fn().mockReturnValue(mockLiveStocks),
      getLiveBySymbol: jest.fn().mockImplementation((symbol: string) => {
        return mockLiveStocks.find(
          (s) => s.name.toUpperCase() === symbol.toUpperCase(),
        ) || null;
      }),
      getLastUpdated: jest.fn().mockReturnValue(new Date()),
      getAllEquities: jest.fn().mockReturnValue([]),
      getEquityBySymbol: jest.fn().mockReturnValue(null),
    };

    portfolioService = {
      getUserPortfolio: jest.fn().mockResolvedValue({
        holdings: [],
        summary: { totalValue: 0, totalCost: 0, totalPnl: 0, totalPnlPercent: 0 },
      }),
    };

    newsAggregatorService = {
      getAllNews: jest.fn().mockResolvedValue({ data: [], total: 0 }),
      getTrendingNews: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContextBuilderService,
        { provide: GseService, useValue: gseService },
        { provide: PortfolioService, useValue: portfolioService },
        { provide: NewsAggregatorService, useValue: newsAggregatorService },
      ],
    }).compile();

    service = module.get<ContextBuilderService>(ContextBuilderService);
  });

  describe('extractStockSymbols', () => {
    it('should extract stock symbol from message', () => {
      const result = service.extractStockSymbols('What is the price of MTNGH?');
      expect(result).toContain('MTNGH');
    });

    it('should extract stock symbol case-insensitively', () => {
      const result = service.extractStockSymbols('Tell me about mtngh stock');
      expect(result).toContain('MTNGH');
    });

    it('should match company names', () => {
      const result = service.extractStockSymbols(
        'How is MTN Ghana performing today?',
      );
      expect(result).toContain('MTNGH');
    });

    it('should match multiple symbols', () => {
      const result = service.extractStockSymbols(
        'Compare MTNGH and GCB performance',
      );
      expect(result).toContain('MTNGH');
      expect(result).toContain('GCB');
    });

    it('should return empty array for no matches', () => {
      const result = service.extractStockSymbols(
        'What is the weather like today?',
      );
      expect(result).toEqual([]);
    });

    it('should return empty array for empty message', () => {
      expect(service.extractStockSymbols('')).toEqual([]);
    });

    it('should return empty array for null/undefined', () => {
      expect(service.extractStockSymbols(null as any)).toEqual([]);
      expect(service.extractStockSymbols(undefined as any)).toEqual([]);
    });

    it('should match CalBank by company name', () => {
      const result = service.extractStockSymbols(
        'What is CalBank stock price?',
      );
      expect(result).toContain('CAL');
    });

    it('should not partially match symbols within other words', () => {
      const result = service.extractStockSymbols('I want to calculate my local gains');
      expect(result).not.toContain('CAL');
    });
  });

  describe('buildMarketContext', () => {
    it('should return market context with matched stock data', async () => {
      const result = await service.buildMarketContext(
        'What is the price of MTNGH?',
      );

      expect(result).toBeDefined();
      expect(result!.requestedStock).toBeDefined();
      expect(result!.requestedStock!.symbol).toBe('MTNGH');
      expect(result!.requestedStock!.price).toBe(1.5);
      expect(result!.requestedStock!.changePercent).toBe(3.2);
      expect(result!.requestedStock!.volume).toBe(150000);
    });

    it('should include top 5 gainers sorted by change descending', async () => {
      const result = await service.buildMarketContext('market trends');

      expect(result).toBeDefined();
      expect(result!.topGainers).toHaveLength(5);
      // FML (4.5) > MTNGH (3.2) > GCB (2.1) > CAL (1.0) > SCB (0.5)
      expect(result!.topGainers[0].symbol).toBe('FML');
      expect(result!.topGainers[0].changePercent).toBe(4.5);
      expect(result!.topGainers[1].symbol).toBe('MTNGH');
      expect(result!.topGainers[2].symbol).toBe('GCB');
    });

    it('should include top 5 losers sorted by change ascending', async () => {
      const result = await service.buildMarketContext('market trends');

      expect(result).toBeDefined();
      expect(result!.topLosers).toHaveLength(5);
      // BOPP (-3.1) < EGH (-2.3) < GOIL (-1.5) < TOTAL (-0.8) < SIC (0.0)
      expect(result!.topLosers[0].symbol).toBe('BOPP');
      expect(result!.topLosers[0].changePercent).toBe(-3.1);
      expect(result!.topLosers[1].symbol).toBe('EGH');
    });

    it('should include composite index', async () => {
      const result = await service.buildMarketContext('market overview');

      expect(result).toBeDefined();
      expect(result!.compositeIndex).toBeDefined();
      expect(typeof result!.compositeIndex).toBe('number');
    });

    it('should not include requestedStock when no symbol matched', async () => {
      const result = await service.buildMarketContext(
        'How does the stock market work?',
      );

      expect(result).toBeDefined();
      expect(result!.requestedStock).toBeUndefined();
      // Should still include gainers/losers and composite index
      expect(result!.topGainers.length).toBeGreaterThan(0);
      expect(result!.topLosers.length).toBeGreaterThan(0);
    });

    it('should return undefined when no market data available', async () => {
      gseService.getAllLive!.mockReturnValue([]);

      const result = await service.buildMarketContext('Tell me about MTNGH');
      expect(result).toBeUndefined();
    });

    it('should include lastUpdated timestamp', async () => {
      const now = new Date();
      gseService.getLastUpdated!.mockReturnValue(now);

      const result = await service.buildMarketContext('market overview');

      expect(result).toBeDefined();
      expect(result!.lastUpdated).toBe(now.toISOString());
    });

    it('should handle stale data (older than 30 minutes)', async () => {
      const staleDate = new Date(Date.now() - 35 * 60 * 1000); // 35 minutes ago
      gseService.getLastUpdated!.mockReturnValue(staleDate);

      const result = await service.buildMarketContext('market overview');

      expect(result).toBeDefined();
      expect(result!.lastUpdated).toBe(staleDate.toISOString());
    });

    it('should handle null lastUpdated gracefully', async () => {
      gseService.getLastUpdated!.mockReturnValue(null);

      const result = await service.buildMarketContext('market overview');

      expect(result).toBeDefined();
      expect(result!.lastUpdated).toBeDefined();
    });
  });

  describe('GSE_SYMBOL_MAP', () => {
    it('should contain major GSE stocks', () => {
      expect(GSE_SYMBOL_MAP).toHaveProperty('MTNGH');
      expect(GSE_SYMBOL_MAP).toHaveProperty('GCB');
      expect(GSE_SYMBOL_MAP).toHaveProperty('GOIL');
      expect(GSE_SYMBOL_MAP).toHaveProperty('CAL');
      expect(GSE_SYMBOL_MAP).toHaveProperty('EGH');
      expect(GSE_SYMBOL_MAP).toHaveProperty('SCB');
    });

    it('should have lowercase aliases for each symbol', () => {
      for (const [, aliases] of Object.entries(GSE_SYMBOL_MAP)) {
        for (const alias of aliases) {
          expect(alias).toBe(alias.toLowerCase());
        }
      }
    });
  });

  describe('buildPortfolioContext', () => {
    const mockPortfolioHoldings = [
      { id: '1', userId: 'user-1', symbol: 'MTNGH', quantity: 100, averageCost: 1.2, totalCost: 120, currentPrice: 1.5, currentValue: 150, pnl: 30, pnlPercent: 25, change: 3.2, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '2', userId: 'user-1', symbol: 'GCB', quantity: 50, averageCost: 4.5, totalCost: 225, currentPrice: 5.0, currentValue: 250, pnl: 25, pnlPercent: 11.11, change: 2.1, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: '3', userId: 'user-1', symbol: 'GOIL', quantity: 200, averageCost: 1.6, totalCost: 320, currentPrice: 1.8, currentValue: 360, pnl: 40, pnlPercent: 12.5, change: -1.5, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    ];

    it('should return undefined when user is not KYC verified', async () => {
      const result = await service.buildPortfolioContext('user-1', false);
      expect(result).toBeUndefined();
      expect(portfolioService.getUserPortfolio).not.toHaveBeenCalled();
    });

    it('should return undefined when portfolio is empty', async () => {
      portfolioService.getUserPortfolio!.mockResolvedValue({
        holdings: [],
        summary: { totalValue: 0, totalCost: 0, totalPnl: 0, totalPnlPercent: 0 },
      });

      const result = await service.buildPortfolioContext('user-1', true);
      expect(result).toBeUndefined();
    });

    it('should return portfolio context with holdings sorted by current value descending', async () => {
      portfolioService.getUserPortfolio!.mockResolvedValue({
        holdings: mockPortfolioHoldings,
        summary: { totalValue: 760, totalCost: 665, totalPnl: 95, totalPnlPercent: 14.29 },
      });

      const result = await service.buildPortfolioContext('user-1', true);

      expect(result).toBeDefined();
      expect(result!.holdings).toHaveLength(3);
      // Sorted by currentValue descending: GOIL (360) > GCB (250) > MTNGH (150)
      expect(result!.holdings[0].symbol).toBe('GOIL');
      expect(result!.holdings[0].currentValue).toBe(360);
      expect(result!.holdings[1].symbol).toBe('GCB');
      expect(result!.holdings[1].currentValue).toBe(250);
      expect(result!.holdings[2].symbol).toBe('MTNGH');
      expect(result!.holdings[2].currentValue).toBe(150);
    });

    it('should include totalValue and totalPnl from portfolio summary', async () => {
      portfolioService.getUserPortfolio!.mockResolvedValue({
        holdings: mockPortfolioHoldings,
        summary: { totalValue: 760, totalCost: 665, totalPnl: 95, totalPnlPercent: 14.29 },
      });

      const result = await service.buildPortfolioContext('user-1', true);

      expect(result).toBeDefined();
      expect(result!.totalValue).toBe(760);
      expect(result!.totalPnl).toBe(95);
    });

    it('should include correct holding fields (symbol, quantity, averageCost, currentValue, unrealizedGainLoss)', async () => {
      portfolioService.getUserPortfolio!.mockResolvedValue({
        holdings: [mockPortfolioHoldings[0]],
        summary: { totalValue: 150, totalCost: 120, totalPnl: 30, totalPnlPercent: 25 },
      });

      const result = await service.buildPortfolioContext('user-1', true);

      expect(result).toBeDefined();
      const holding = result!.holdings[0];
      expect(holding.symbol).toBe('MTNGH');
      expect(holding.quantity).toBe(100);
      expect(holding.averageCost).toBe(1.2);
      expect(holding.currentValue).toBe(150);
      expect(holding.unrealizedGainLoss).toBe(30);
    });

    it('should cap holdings at 20 (PORTFOLIO_CONTEXT_MAX_HOLDINGS)', async () => {
      // Create 25 holdings
      const manyHoldings = Array.from({ length: 25 }, (_, i) => ({
        id: `${i}`,
        userId: 'user-1',
        symbol: `STOCK${i}`,
        quantity: 100,
        averageCost: 1.0,
        totalCost: 100,
        currentPrice: 2.0,
        currentValue: 200 + i, // Unique values for sorting
        pnl: 100 + i,
        pnlPercent: 100,
        change: 1.0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      }));

      portfolioService.getUserPortfolio!.mockResolvedValue({
        holdings: manyHoldings,
        summary: { totalValue: 5000, totalCost: 2500, totalPnl: 2500, totalPnlPercent: 100 },
      });

      const result = await service.buildPortfolioContext('user-1', true);

      expect(result).toBeDefined();
      expect(result!.holdings).toHaveLength(20);
      // Should be the top 20 by currentValue (highest first)
      expect(result!.holdings[0].currentValue).toBe(224); // 200 + 24
      expect(result!.holdings[19].currentValue).toBe(205); // 200 + 5
    });

    it('should return undefined on portfolio service error', async () => {
      portfolioService.getUserPortfolio!.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await service.buildPortfolioContext('user-1', true);
      expect(result).toBeUndefined();
    });

    it('should return undefined on timeout', async () => {
      // Simulate a slow portfolio service that exceeds the 3-second timeout
      portfolioService.getUserPortfolio!.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          holdings: mockPortfolioHoldings,
          summary: { totalValue: 760, totalCost: 665, totalPnl: 95, totalPnlPercent: 14.29 },
        }), 4000)),
      );

      const result = await service.buildPortfolioContext('user-1', true);
      expect(result).toBeUndefined();
    }, 10000);
  });

  describe('buildNewsContext', () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

    const mockNewsArticles: NewsArticle[] = [
      {
        id: '1',
        title: 'MTN Ghana Reports Strong Q1 Performance',
        content: 'Full article content here...',
        summary: 'MTN Ghana shows strong performance with 15% growth.',
        source: 'Ghana Business News',
        sourceUrl: 'https://example.com/1',
        relatedSymbols: ['MTNGH'],
        category: 'company',
        viewCount: 2500,
        commentCount: 10,
        reactionCount: 50,
        createdAt: twoDaysAgo.toISOString(),
        updatedAt: twoDaysAgo.toISOString(),
      },
      {
        id: '2',
        title: 'GCB Bank Expands Digital Services',
        content: 'Full article content here...',
        summary: 'GCB Bank launches new mobile banking features for customers across Ghana.',
        source: 'Business & Financial Times',
        sourceUrl: 'https://example.com/2',
        relatedSymbols: ['GCB'],
        category: 'company',
        viewCount: 1800,
        commentCount: 5,
        reactionCount: 30,
        createdAt: twoDaysAgo.toISOString(),
        updatedAt: twoDaysAgo.toISOString(),
      },
      {
        id: '3',
        title: 'MTN Ghana Announces Dividend',
        content: 'Full article content here...',
        summary: 'MTN Ghana announces a dividend payout for shareholders following strong quarterly results.',
        source: 'Graphic Business',
        sourceUrl: 'https://example.com/3',
        relatedSymbols: ['MTNGH'],
        category: 'market',
        viewCount: 3000,
        commentCount: 20,
        reactionCount: 80,
        createdAt: twoDaysAgo.toISOString(),
        updatedAt: twoDaysAgo.toISOString(),
      },
      {
        id: '4',
        title: 'Old MTN Article',
        content: 'Full article content here...',
        summary: 'This is an old article about MTN Ghana from 10 days ago.',
        source: 'Citi Business News',
        sourceUrl: 'https://example.com/4',
        relatedSymbols: ['MTNGH'],
        category: 'company',
        viewCount: 500,
        commentCount: 2,
        reactionCount: 10,
        createdAt: tenDaysAgo.toISOString(),
        updatedAt: tenDaysAgo.toISOString(),
      },
    ];

    it('should return news articles for stock queries filtered by symbol', async () => {
      newsAggregatorService.getAllNews!.mockResolvedValue({
        data: mockNewsArticles.filter(a => a.relatedSymbols?.includes('MTNGH')),
        total: 3,
      });

      const result = await service.buildNewsContext(['MTNGH'], false);

      expect(result).toBeDefined();
      expect(result!.articles.length).toBeGreaterThan(0);
      expect(result!.articles.length).toBeLessThanOrEqual(3);
      expect(newsAggregatorService.getAllNews).toHaveBeenCalledWith(
        expect.objectContaining({ symbol: 'MTNGH' }),
      );
    });

    it('should filter stock query articles to last 7 days', async () => {
      newsAggregatorService.getAllNews!.mockResolvedValue({
        data: mockNewsArticles.filter(a => a.relatedSymbols?.includes('MTNGH')),
        total: 3,
      });

      const result = await service.buildNewsContext(['MTNGH'], false);

      expect(result).toBeDefined();
      const articleDates = result!.articles.map(a => new Date(a.publishedAt));
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      for (const date of articleDates) {
        expect(date.getTime()).toBeGreaterThanOrEqual(sevenDaysAgo.getTime());
      }
    });

    it('should limit stock query articles to 3 (NEWS_STOCK_QUERY_MAX_ARTICLES)', async () => {
      const manyArticles = Array.from({ length: 6 }, (_, i) => ({
        ...mockNewsArticles[0],
        id: `article-${i}`,
        title: `Article ${i}`,
        createdAt: twoDaysAgo.toISOString(),
      }));

      newsAggregatorService.getAllNews!.mockResolvedValue({
        data: manyArticles,
        total: 6,
      });

      const result = await service.buildNewsContext(['MTNGH'], false);

      expect(result).toBeDefined();
      expect(result!.articles.length).toBeLessThanOrEqual(3);
    });

    it('should return trending articles for sentiment queries', async () => {
      const trendingArticles = [...mockNewsArticles]
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 5);

      newsAggregatorService.getTrendingNews!.mockResolvedValue(trendingArticles);

      const result = await service.buildNewsContext([], true);

      expect(result).toBeDefined();
      expect(result!.articles.length).toBeLessThanOrEqual(5);
      expect(newsAggregatorService.getTrendingNews).toHaveBeenCalledWith(5);
    });

    it('should truncate article summaries to 200 characters', async () => {
      const longSummary = 'A'.repeat(300);
      const articleWithLongSummary: NewsArticle = {
        ...mockNewsArticles[0],
        summary: longSummary,
      };

      newsAggregatorService.getTrendingNews!.mockResolvedValue([articleWithLongSummary]);

      const result = await service.buildNewsContext([], true);

      expect(result).toBeDefined();
      expect(result!.articles[0].summary.length).toBeLessThanOrEqual(200);
    });

    it('should not truncate summaries within limit', async () => {
      const shortSummary = 'Short summary about MTN Ghana.';
      const articleWithShortSummary: NewsArticle = {
        ...mockNewsArticles[0],
        summary: shortSummary,
      };

      newsAggregatorService.getTrendingNews!.mockResolvedValue([articleWithShortSummary]);

      const result = await service.buildNewsContext([], true);

      expect(result).toBeDefined();
      expect(result!.articles[0].summary).toBe(shortSummary);
    });

    it('should return undefined when news service throws an error', async () => {
      newsAggregatorService.getTrendingNews!.mockRejectedValue(
        new Error('News service unavailable'),
      );

      const result = await service.buildNewsContext([], true);
      expect(result).toBeUndefined();
    });

    it('should return undefined when no articles are found', async () => {
      newsAggregatorService.getAllNews!.mockResolvedValue({ data: [], total: 0 });

      const result = await service.buildNewsContext(['MTNGH'], false);
      expect(result).toBeUndefined();
    });

    it('should return undefined on timeout', async () => {
      newsAggregatorService.getTrendingNews!.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockNewsArticles), 4000)),
      );

      const result = await service.buildNewsContext([], true);
      expect(result).toBeUndefined();
    }, 10000);

    it('should include only summary field not full content', async () => {
      newsAggregatorService.getTrendingNews!.mockResolvedValue([mockNewsArticles[0]]);

      const result = await service.buildNewsContext([], true);

      expect(result).toBeDefined();
      const article = result!.articles[0];
      expect(article).toHaveProperty('summary');
      expect(article).toHaveProperty('title');
      expect(article).toHaveProperty('source');
      expect(article).toHaveProperty('publishedAt');
      expect(article).toHaveProperty('relatedSymbols');
      expect(article).not.toHaveProperty('content');
    });

    it('should use sentiment query path when isSentimentQuery is true', async () => {
      newsAggregatorService.getTrendingNews!.mockResolvedValue(mockNewsArticles.slice(0, 2));

      const result = await service.buildNewsContext(['MTNGH'], true);

      expect(result).toBeDefined();
      expect(newsAggregatorService.getTrendingNews).toHaveBeenCalled();
      expect(newsAggregatorService.getAllNews).not.toHaveBeenCalled();
    });

    it('should deduplicate articles when querying multiple symbols', async () => {
      newsAggregatorService.getAllNews!.mockResolvedValue({
        data: [mockNewsArticles[0]],
        total: 1,
      });

      const result = await service.buildNewsContext(['MTNGH', 'GCB'], false);

      expect(result).toBeDefined();
      const titles = result!.articles.map(a => a.title);
      const uniqueTitles = new Set(titles);
      expect(titles.length).toBe(uniqueTitles.size);
    });
  });
});

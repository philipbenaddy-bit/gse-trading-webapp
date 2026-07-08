import { Injectable, Logger } from '@nestjs/common';

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  source: string;
  sourceUrl: string;
  imageUrl?: string;
  relatedSymbols?: string[];
  category: string;
  viewCount: number;
  commentCount: number;
  reactionCount: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class NewsAggregatorService {
  private readonly logger = new Logger(NewsAggregatorService.name);
  private newsCache: NewsArticle[] = [];
  private lastFetch: Date | null = null;
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.fetchAndCacheNews();
  }

  async getAllNews(params: {
    category?: string;
    symbol?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: NewsArticle[]; total: number }> {
    if (!this.lastFetch || Date.now() - this.lastFetch.getTime() > this.CACHE_DURATION) {
      await this.fetchAndCacheNews();
    }

    let filteredNews = [...this.newsCache];

    if (params.category && params.category !== 'all') {
      filteredNews = filteredNews.filter(
        (news) => news.category.toLowerCase() === params.category.toLowerCase()
      );
    }

    if (params.symbol) {
      filteredNews = filteredNews.filter(
        (news) => news.relatedSymbols?.includes(params.symbol)
      );
    }

    const total = filteredNews.length;
    const offset = params.offset || 0;
    const limit = params.limit || 20;
    const paginatedNews = filteredNews.slice(offset, offset + limit);

    return { data: paginatedNews, total };
  }

  async getTrendingNews(limit: number = 10): Promise<NewsArticle[]> {
    if (!this.lastFetch || Date.now() - this.lastFetch.getTime() > this.CACHE_DURATION) {
      await this.fetchAndCacheNews();
    }

    return this.newsCache
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit);
  }

  private async fetchAndCacheNews(): Promise<void> {
    try {
      this.logger.log('Fetching Ghana finance news...');
      const sampleNews = this.generateSampleGhanaFinanceNews();
      this.newsCache = sampleNews;
      this.lastFetch = new Date();
      this.logger.log(`Cached ${sampleNews.length} news articles`);
    } catch (error) {
      this.logger.error('Failed to fetch news:', error.message);
      if (this.newsCache.length === 0) {
        this.newsCache = this.generateSampleGhanaFinanceNews();
      }
    }
  }

  private generateSampleGhanaFinanceNews(): NewsArticle[] {
    const now = new Date();
    const articles: NewsArticle[] = [];

    // Core news templates
    const companies = ['MTN Ghana', 'GCB Bank', 'Standard Chartered', 'GOIL', 'CAL Bank', 'Ecobank Ghana', 'Tullow Oil', 'AngloGold Ashanti'];
    const symbols = [['MTNGH'], ['GCB'], ['SCB'], ['GOIL'], ['CAL'], ['EGH'], ['TLW'], ['AGA']];
    const categories = ['market', 'company', 'economy', 'analysis', 'regulation'];
    const sources = ['Ghana Business News', 'Business & Financial Times', 'Graphic Business', 'Citi Business News', 'Joy Business'];
    const images = [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800',
      'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=800',
      'https://images.unsplash.com/photo-1545262810-77515befe149?w=800',
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800',
    ];

    // Generate 60 diverse articles
    for (let i = 1; i <= 60; i++) {
      const hoursAgo = i * 2;
      const companyIndex = (i - 1) % companies.length;
      const categoryIndex = (i - 1) % categories.length;
      
      articles.push({
        id: i.toString(),
        title: this.generateTitle(i, companies[companyIndex]),
        content: this.generateContent(i, companies[companyIndex]),
        summary: this.generateSummary(i, companies[companyIndex]),
        source: sources[i % sources.length],
        sourceUrl: 'https://www.ghanabusinessnews.com',
        imageUrl: images[i % images.length],
        relatedSymbols: i % 3 === 0 ? [] : symbols[companyIndex],
        category: categories[categoryIndex],
        viewCount: Math.floor(Math.random() * 3000) + 500,
        commentCount: Math.floor(Math.random() * 50),
        reactionCount: Math.floor(Math.random() * 150),
        createdAt: new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString(),
      });
    }

    return articles;
  }

  private generateTitle(index: number, company: string): string {
    const titles = [
      `${company} Reports Strong Q${(index % 4) + 1} Performance`,
      `Ghana Stock Exchange Sees ${5 + (index % 15)}% Growth`,
      `${company} Announces Major Expansion Plans`,
      `Bank of Ghana Updates Monetary Policy Framework`,
      `${company} Achieves Record Revenue Milestone`,
      `Analysts Upgrade ${company} Stock Rating`,
      `Ghana's Economy Shows Resilient Growth`,
      `${company} Launches New Digital Services`,
      `Foreign Investment in ${company} Increases`,
      `${company} Reports ${10 + (index % 20)}% Profit Growth`,
    ];
    return titles[index % titles.length];
  }

  private generateContent(index: number, company: string): string {
    const contents = [
      `${company} has demonstrated exceptional performance in recent quarters, driven by strategic initiatives and market expansion. The company's focus on innovation and customer service has positioned it as a market leader in Ghana's financial sector.`,
      `Market analysts report significant developments in the Ghanaian financial sector, with ${company} leading the charge. Industry experts predict continued growth as the company expands its operations and introduces new products to meet evolving customer needs.`,
      `${company} announced today that it has achieved remarkable milestones in its operational efficiency and market reach. The company's management attributes this success to its dedicated workforce and strategic partnerships across the region.`,
      `In a significant development for Ghana's economy, ${company} has unveiled plans for major investments in infrastructure and technology. This move is expected to create numerous employment opportunities and boost economic activity in key sectors.`,
      `${company} continues to strengthen its position in the market through innovative solutions and customer-centric approaches. The company's latest financial results reflect strong fundamentals and sustainable growth trajectory.`,
    ];
    return contents[index % contents.length];
  }

  private generateSummary(index: number, company: string): string {
    const summaries = [
      `${company} shows strong performance with ${10 + (index % 20)}% growth.`,
      `Market analysts positive on ${company}'s outlook.`,
      `${company} expands operations across Ghana.`,
      `Strong quarterly results from ${company}.`,
      `${company} announces strategic initiatives.`,
    ];
    return summaries[index % summaries.length];
  }

}
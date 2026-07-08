/**
 * Stock Query Prompt Template
 *
 * Assembles stock-specific market data into a structured context block
 * for the LLM. Uses parameterized template literals to prevent injection
 * via market data or news content.
 *
 * Requirements: 4.6
 */

export interface StockDataParams {
  symbol: string;
  price: number;
  changePercent: number;
  volume: number;
}

export interface MarketIndexParams {
  compositeIndex: number;
  lastUpdated: string;
}

export interface GainerLoserParams {
  symbol: string;
  changePercent: number;
}

export interface NewsArticleParams {
  title: string;
  source: string;
  publishedAt: string;
  summary: string;
}

export interface StockQueryTemplateParams {
  /** The specific stock the user is asking about (if identified) */
  stock?: StockDataParams;
  /** GSE Composite Index data */
  marketIndex?: MarketIndexParams;
  /** Top gaining stocks for the session */
  topGainers?: GainerLoserParams[];
  /** Top losing stocks for the session */
  topLosers?: GainerLoserParams[];
  /** Data freshness timestamp (included when data is older than 30 minutes) */
  dataFreshnessNote?: string;
  /** Relevant news articles for the queried stock */
  newsArticles?: NewsArticleParams[];
}

/**
 * Builds the stock query context block that is injected into the LLM prompt.
 * All dynamic values are interpolated via template literals — no string concatenation.
 */
export function buildStockQueryContext(params: StockQueryTemplateParams): string {
  const sections: string[] = [];

  if (params.dataFreshnessNote) {
    sections.push(`DATA FRESHNESS WARNING: ${params.dataFreshnessNote}`);
  }

  if (params.stock) {
    const { symbol, price, changePercent, volume } = params.stock;
    sections.push(
      `REQUESTED STOCK DATA:
- Symbol: ${symbol}
- Current Price: GHS ${price.toFixed(2)}
- Daily Change: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%
- Volume: ${volume.toLocaleString()}`,
    );
  }

  if (params.marketIndex) {
    const { compositeIndex, lastUpdated } = params.marketIndex;
    sections.push(
      `GSE COMPOSITE INDEX:
- Value: ${compositeIndex.toFixed(2)}
- Last Updated: ${lastUpdated}`,
    );
  }

  if (params.topGainers && params.topGainers.length > 0) {
    const gainersLines = params.topGainers.map(
      (g) => `  ${g.symbol}: +${g.changePercent.toFixed(2)}%`,
    );
    sections.push(`TOP GAINERS:\n${gainersLines.join('\n')}`);
  }

  if (params.topLosers && params.topLosers.length > 0) {
    const losersLines = params.topLosers.map(
      (l) => `  ${l.symbol}: ${l.changePercent.toFixed(2)}%`,
    );
    sections.push(`TOP LOSERS:\n${losersLines.join('\n')}`);
  }

  if (params.newsArticles && params.newsArticles.length > 0) {
    const articleLines = params.newsArticles.map(
      (article) =>
        `- "${article.title}" (${article.source}, ${article.publishedAt})\n  Summary: ${article.summary}`,
    );
    sections.push(`RELATED NEWS:\n${articleLines.join('\n')}`);
  }

  if (sections.length === 0) {
    return 'MARKET DATA: No specific market data available for this query.';
  }

  return sections.join('\n\n');
}

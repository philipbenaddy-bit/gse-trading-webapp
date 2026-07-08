/**
 * Portfolio Query Prompt Template
 *
 * Assembles portfolio holdings and related data into a structured context
 * block for the LLM. Uses parameterized template literals to prevent
 * injection via portfolio data or news content.
 *
 * Requirements: 4.6
 */

export interface HoldingParams {
  symbol: string;
  quantity: number;
  averageCost: number;
  currentValue: number;
  unrealizedPnL: number;
}

export interface PortfolioNewsArticleParams {
  title: string;
  source: string;
  publishedAt: string;
  summary: string;
}

export interface PortfolioQueryTemplateParams {
  /** User's portfolio holdings (up to 20, sorted by current value descending) */
  holdings: HoldingParams[];
  /** Total portfolio value in GHS */
  totalValue: number;
  /** Total unrealized P&L in GHS */
  totalPnL: number;
  /** News articles related to the user's holdings */
  newsArticles?: PortfolioNewsArticleParams[];
}

/**
 * Builds the portfolio analysis context block that is injected into the LLM prompt.
 * All dynamic values are interpolated via template literals — no string concatenation.
 */
export function buildPortfolioQueryContext(params: PortfolioQueryTemplateParams): string {
  const sections: string[] = [];

  const { holdings, totalValue, totalPnL } = params;

  // Portfolio summary
  sections.push(
    `PORTFOLIO SUMMARY:
- Total Value: GHS ${totalValue.toFixed(2)}
- Total Unrealized P&L: ${totalPnL >= 0 ? '+' : ''}GHS ${totalPnL.toFixed(2)} (${totalValue > 0 ? ((totalPnL / totalValue) * 100).toFixed(2) : '0.00'}%)
- Number of Holdings: ${holdings.length}`,
  );

  // Individual holdings
  if (holdings.length > 0) {
    const holdingLines = holdings.map((h) => {
      const pnlSign = h.unrealizedPnL >= 0 ? '+' : '';
      return `  ${h.symbol}: ${h.quantity} shares | Avg Cost: GHS ${h.averageCost.toFixed(2)} | Current Value: GHS ${h.currentValue.toFixed(2)} | P&L: ${pnlSign}GHS ${h.unrealizedPnL.toFixed(2)}`;
    });
    sections.push(`HOLDINGS:\n${holdingLines.join('\n')}`);
  }

  // Related news
  if (params.newsArticles && params.newsArticles.length > 0) {
    const articleLines = params.newsArticles.map(
      (article) =>
        `- "${article.title}" (${article.source}, ${article.publishedAt})\n  Summary: ${article.summary}`,
    );
    sections.push(`NEWS RELATED TO YOUR HOLDINGS:\n${articleLines.join('\n')}`);
  }

  return sections.join('\n\n');
}

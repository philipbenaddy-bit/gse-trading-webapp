"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPortfolioQueryContext = buildPortfolioQueryContext;
function buildPortfolioQueryContext(params) {
    const sections = [];
    const { holdings, totalValue, totalPnL } = params;
    sections.push(`PORTFOLIO SUMMARY:
- Total Value: GHS ${totalValue.toFixed(2)}
- Total Unrealized P&L: ${totalPnL >= 0 ? '+' : ''}GHS ${totalPnL.toFixed(2)} (${totalValue > 0 ? ((totalPnL / totalValue) * 100).toFixed(2) : '0.00'}%)
- Number of Holdings: ${holdings.length}`);
    if (holdings.length > 0) {
        const holdingLines = holdings.map((h) => {
            const pnlSign = h.unrealizedPnL >= 0 ? '+' : '';
            return `  ${h.symbol}: ${h.quantity} shares | Avg Cost: GHS ${h.averageCost.toFixed(2)} | Current Value: GHS ${h.currentValue.toFixed(2)} | P&L: ${pnlSign}GHS ${h.unrealizedPnL.toFixed(2)}`;
        });
        sections.push(`HOLDINGS:\n${holdingLines.join('\n')}`);
    }
    if (params.newsArticles && params.newsArticles.length > 0) {
        const articleLines = params.newsArticles.map((article) => `- "${article.title}" (${article.source}, ${article.publishedAt})\n  Summary: ${article.summary}`);
        sections.push(`NEWS RELATED TO YOUR HOLDINGS:\n${articleLines.join('\n')}`);
    }
    return sections.join('\n\n');
}
//# sourceMappingURL=portfolio-query.template.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildStockQueryContext = buildStockQueryContext;
function buildStockQueryContext(params) {
    const sections = [];
    if (params.dataFreshnessNote) {
        sections.push(`DATA FRESHNESS WARNING: ${params.dataFreshnessNote}`);
    }
    if (params.stock) {
        const { symbol, price, changePercent, volume } = params.stock;
        sections.push(`REQUESTED STOCK DATA:
- Symbol: ${symbol}
- Current Price: GHS ${price.toFixed(2)}
- Daily Change: ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%
- Volume: ${volume.toLocaleString()}`);
    }
    if (params.marketIndex) {
        const { compositeIndex, lastUpdated } = params.marketIndex;
        sections.push(`GSE COMPOSITE INDEX:
- Value: ${compositeIndex.toFixed(2)}
- Last Updated: ${lastUpdated}`);
    }
    if (params.topGainers && params.topGainers.length > 0) {
        const gainersLines = params.topGainers.map((g) => `  ${g.symbol}: +${g.changePercent.toFixed(2)}%`);
        sections.push(`TOP GAINERS:\n${gainersLines.join('\n')}`);
    }
    if (params.topLosers && params.topLosers.length > 0) {
        const losersLines = params.topLosers.map((l) => `  ${l.symbol}: ${l.changePercent.toFixed(2)}%`);
        sections.push(`TOP LOSERS:\n${losersLines.join('\n')}`);
    }
    if (params.newsArticles && params.newsArticles.length > 0) {
        const articleLines = params.newsArticles.map((article) => `- "${article.title}" (${article.source}, ${article.publishedAt})\n  Summary: ${article.summary}`);
        sections.push(`RELATED NEWS:\n${articleLines.join('\n')}`);
    }
    if (sections.length === 0) {
        return 'MARKET DATA: No specific market data available for this query.';
    }
    return sections.join('\n\n');
}
//# sourceMappingURL=stock-query.template.js.map
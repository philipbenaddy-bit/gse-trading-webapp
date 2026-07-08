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
    holdings: HoldingParams[];
    totalValue: number;
    totalPnL: number;
    newsArticles?: PortfolioNewsArticleParams[];
}
export declare function buildPortfolioQueryContext(params: PortfolioQueryTemplateParams): string;

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
    stock?: StockDataParams;
    marketIndex?: MarketIndexParams;
    topGainers?: GainerLoserParams[];
    topLosers?: GainerLoserParams[];
    dataFreshnessNote?: string;
    newsArticles?: NewsArticleParams[];
}
export declare function buildStockQueryContext(params: StockQueryTemplateParams): string;

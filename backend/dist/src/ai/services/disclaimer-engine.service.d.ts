export declare class DisclaimerEngineService {
    static readonly FINANCIAL_DISCLAIMER = "This information is for educational purposes only and does not constitute investment advice. Always consult a qualified financial advisor before making investment decisions.";
    getDisclaimer(): string;
    appendDisclaimer(response: string): string;
    hasDisclaimer(text: string): boolean;
}

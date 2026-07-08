"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const disclaimer_engine_service_1 = require("./disclaimer-engine.service");
describe('DisclaimerEngineService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [disclaimer_engine_service_1.DisclaimerEngineService],
        }).compile();
        service = module.get(disclaimer_engine_service_1.DisclaimerEngineService);
    });
    describe('getDisclaimer', () => {
        it('should return the financial disclaimer text', () => {
            const disclaimer = service.getDisclaimer();
            expect(disclaimer).toBe('This information is for educational purposes only and does not constitute investment advice. Always consult a qualified financial advisor before making investment decisions.');
        });
        it('should return the same value as the static constant', () => {
            expect(service.getDisclaimer()).toBe(disclaimer_engine_service_1.DisclaimerEngineService.FINANCIAL_DISCLAIMER);
        });
    });
    describe('appendDisclaimer', () => {
        it('should append the disclaimer to a plain AI response', () => {
            const response = 'The GSE Composite Index rose 1.2% today.';
            const result = service.appendDisclaimer(response);
            expect(result).toContain(response);
            expect(result).toContain(disclaimer_engine_service_1.DisclaimerEngineService.FINANCIAL_DISCLAIMER);
        });
        it('should separate the disclaimer with a horizontal rule', () => {
            const response = 'Stock XYZ is trading at GHS 5.00.';
            const result = service.appendDisclaimer(response);
            expect(result).toBe(`${response}\n\n---\n${disclaimer_engine_service_1.DisclaimerEngineService.FINANCIAL_DISCLAIMER}`);
        });
        it('should not double-append the disclaimer if already present', () => {
            const response = `Some analysis.\n\n---\n${disclaimer_engine_service_1.DisclaimerEngineService.FINANCIAL_DISCLAIMER}`;
            const result = service.appendDisclaimer(response);
            expect(result).toBe(response);
            const occurrences = result.split(disclaimer_engine_service_1.DisclaimerEngineService.FINANCIAL_DISCLAIMER).length - 1;
            expect(occurrences).toBe(1);
        });
        it('should handle empty string input', () => {
            const result = service.appendDisclaimer('');
            expect(result).toContain(disclaimer_engine_service_1.DisclaimerEngineService.FINANCIAL_DISCLAIMER);
        });
        it('should handle multiline AI responses', () => {
            const response = 'Line 1: Market overview.\nLine 2: Top gainers.\nLine 3: Summary.';
            const result = service.appendDisclaimer(response);
            expect(result).toContain(response);
            expect(result).toContain(disclaimer_engine_service_1.DisclaimerEngineService.FINANCIAL_DISCLAIMER);
        });
        it('should handle responses with special characters', () => {
            const response = 'GHS 1,234.56 (+2.5%) — MTN Ghana Ltd.';
            const result = service.appendDisclaimer(response);
            expect(result).toContain(response);
            expect(result).toContain(disclaimer_engine_service_1.DisclaimerEngineService.FINANCIAL_DISCLAIMER);
        });
    });
    describe('hasDisclaimer', () => {
        it('should return true when text contains the disclaimer', () => {
            const text = `Some response.\n\n---\n${disclaimer_engine_service_1.DisclaimerEngineService.FINANCIAL_DISCLAIMER}`;
            expect(service.hasDisclaimer(text)).toBe(true);
        });
        it('should return false when text does not contain the disclaimer', () => {
            const text = 'Just a regular response without any disclaimer.';
            expect(service.hasDisclaimer(text)).toBe(false);
        });
        it('should return false for empty string', () => {
            expect(service.hasDisclaimer('')).toBe(false);
        });
        it('should return false for partial disclaimer text', () => {
            const text = 'This information is for educational purposes only.';
            expect(service.hasDisclaimer(text)).toBe(false);
        });
        it('should return true when disclaimer appears anywhere in the text', () => {
            const text = `Prefix text. ${disclaimer_engine_service_1.DisclaimerEngineService.FINANCIAL_DISCLAIMER} Suffix text.`;
            expect(service.hasDisclaimer(text)).toBe(true);
        });
    });
    describe('idempotency', () => {
        it('should produce the same result when appendDisclaimer is called multiple times', () => {
            const response = 'Market analysis for today.';
            const first = service.appendDisclaimer(response);
            const second = service.appendDisclaimer(first);
            const third = service.appendDisclaimer(second);
            expect(first).toBe(second);
            expect(second).toBe(third);
        });
    });
});
//# sourceMappingURL=disclaimer-engine.service.spec.js.map
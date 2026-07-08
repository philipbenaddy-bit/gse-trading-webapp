"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var DisclaimerEngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisclaimerEngineService = void 0;
const common_1 = require("@nestjs/common");
let DisclaimerEngineService = DisclaimerEngineService_1 = class DisclaimerEngineService {
    getDisclaimer() {
        return DisclaimerEngineService_1.FINANCIAL_DISCLAIMER;
    }
    appendDisclaimer(response) {
        if (this.hasDisclaimer(response)) {
            return response;
        }
        return `${response}\n\n---\n${DisclaimerEngineService_1.FINANCIAL_DISCLAIMER}`;
    }
    hasDisclaimer(text) {
        return text.includes(DisclaimerEngineService_1.FINANCIAL_DISCLAIMER);
    }
};
exports.DisclaimerEngineService = DisclaimerEngineService;
DisclaimerEngineService.FINANCIAL_DISCLAIMER = 'This information is for educational purposes only and does not constitute investment advice. Always consult a qualified financial advisor before making investment decisions.';
exports.DisclaimerEngineService = DisclaimerEngineService = DisclaimerEngineService_1 = __decorate([
    (0, common_1.Injectable)()
], DisclaimerEngineService);
//# sourceMappingURL=disclaimer-engine.service.js.map
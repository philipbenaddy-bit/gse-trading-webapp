"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsightCardDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class InsightCardDto {
}
exports.InsightCardDto = InsightCardDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unique identifier for the insight card',
        example: '770e8400-e29b-41d4-a716-446655440002',
    }),
    __metadata("design:type", String)
], InsightCardDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Insight card title (max 80 characters)',
        maxLength: 80,
        example: 'MTN Ghana shows strong momentum',
    }),
    __metadata("design:type", String)
], InsightCardDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Brief summary of the insight (max 150 characters)',
        maxLength: 150,
        example: 'MTNGH has gained 5.2% this week on increased trading volume following Q2 earnings.',
    }),
    __metadata("design:type", String)
], InsightCardDto.prototype, "summary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Stock symbol or market event indicator this insight relates to',
        example: 'MTNGH',
    }),
    __metadata("design:type", String)
], InsightCardDto.prototype, "relevanceSymbol", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Financial disclaimer for the insight',
        example: 'This information is for educational purposes only and does not constitute investment advice.',
    }),
    __metadata("design:type", String)
], InsightCardDto.prototype, "disclaimer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ISO 8601 timestamp when the insight was generated',
        example: '2024-06-15T10:00:00.000Z',
    }),
    __metadata("design:type", String)
], InsightCardDto.prototype, "generatedAt", void 0);
//# sourceMappingURL=insight.dto.js.map
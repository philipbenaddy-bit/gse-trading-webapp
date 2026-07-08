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
exports.ConversationListDto = exports.ConversationSummaryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ConversationSummaryDto {
}
exports.ConversationSummaryDto = ConversationSummaryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unique conversation identifier',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], ConversationSummaryDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Conversation title (auto-generated or user-defined)',
        example: 'MTN Ghana price discussion',
    }),
    __metadata("design:type", String)
], ConversationSummaryDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ISO 8601 timestamp of the last message in the conversation',
        example: '2024-06-15T14:30:00.000Z',
    }),
    __metadata("design:type", String)
], ConversationSummaryDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Total number of messages in the conversation',
        example: 12,
    }),
    __metadata("design:type", Number)
], ConversationSummaryDto.prototype, "messageCount", void 0);
class ConversationListDto {
}
exports.ConversationListDto = ConversationListDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array of conversation summaries sorted by most recent',
        type: [ConversationSummaryDto],
    }),
    __metadata("design:type", Array)
], ConversationListDto.prototype, "conversations", void 0);
//# sourceMappingURL=conversation.dto.js.map
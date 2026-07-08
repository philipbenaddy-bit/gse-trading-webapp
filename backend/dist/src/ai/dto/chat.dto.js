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
exports.ChatResponseDto = exports.SendMessageDto = exports.SentimentDto = exports.ChatDto = exports.ChatMessageDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class ChatMessageDto {
}
exports.ChatMessageDto = ChatMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['user', 'assistant'] }),
    __metadata("design:type", String)
], ChatMessageDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChatMessageDto.prototype, "content", void 0);
class ChatDto {
}
exports.ChatDto = ChatDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User message' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], ChatDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ChatMessageDto], required: false }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ChatDto.prototype, "history", void 0);
class SentimentDto {
}
exports.SentimentDto = SentimentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String] }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], SentimentDto.prototype, "headlines", void 0);
class SendMessageDto {
}
exports.SendMessageDto = SendMessageDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User message to send to the AI assistant',
        minLength: 1,
        maxLength: 1000,
        example: 'What is the current price of MTN Ghana?',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], SendMessageDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'UUID of an existing conversation to continue. Omit to start a new conversation.',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "conversationId", void 0);
class ChatResponseDto {
}
exports.ChatResponseDto = ChatResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'UUID of the conversation this message belongs to',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    __metadata("design:type", String)
], ChatResponseDto.prototype, "conversationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'UUID of the AI response message',
        example: '660e8400-e29b-41d4-a716-446655440001',
    }),
    __metadata("design:type", String)
], ChatResponseDto.prototype, "messageId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The AI-generated reply text',
        example: 'MTN Ghana (MTNGH) is currently trading at GHS 1.25, up 2.5% today.',
    }),
    __metadata("design:type", String)
], ChatResponseDto.prototype, "reply", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Financial disclaimer appended to the response',
        example: 'This information is for educational purposes only and does not constitute investment advice.',
    }),
    __metadata("design:type", String)
], ChatResponseDto.prototype, "disclaimer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Current rate limit status for the user',
        example: {
            hourlyRemaining: 28,
            dailyRemaining: 95,
            resetInSeconds: 3200,
            limitExceeded: null,
        },
    }),
    __metadata("design:type", Object)
], ChatResponseDto.prototype, "rateLimitInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'List of data sources used to generate the response',
        type: [String],
        example: ['market_data', 'news'],
    }),
    __metadata("design:type", Array)
], ChatResponseDto.prototype, "dataSources", void 0);
//# sourceMappingURL=chat.dto.js.map
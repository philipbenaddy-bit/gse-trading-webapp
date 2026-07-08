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
exports.CreateOrderDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const order_entity_1 = require("../entities/order.entity");
const sanitization_pipe_1 = require("../../common/pipes/sanitization.pipe");
class CreateOrderDto {
}
exports.CreateOrderDto = CreateOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'GCB',
        description: 'GSE stock symbol (2-4 characters, uppercase)',
        minLength: 2,
        maxLength: 4
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 4, { message: 'Symbol must be between 2 and 4 characters' }),
    (0, class_validator_1.Matches)(/^[A-Z]+$/, { message: 'Symbol must contain only uppercase letters' }),
    (0, sanitization_pipe_1.ToUpperCase)(),
    (0, sanitization_pipe_1.Sanitize)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "symbol", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: order_entity_1.OrderType,
        description: 'Order type: market or limit'
    }),
    (0, class_validator_1.IsEnum)(order_entity_1.OrderType, { message: 'Type must be either market or limit' }),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: order_entity_1.OrderSide,
        description: 'Order side: buy or sell'
    }),
    (0, class_validator_1.IsEnum)(order_entity_1.OrderSide, { message: 'Side must be either buy or sell' }),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "side", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 100,
        description: 'Number of shares to trade (1-10,000)',
        minimum: 1,
        maximum: 10000
    }),
    (0, class_validator_1.IsInt)({ message: 'Quantity must be a whole number' }),
    (0, class_validator_1.Min)(1, { message: 'Quantity must be at least 1' }),
    (0, class_validator_1.Max)(10000, { message: 'Quantity cannot exceed 10,000 shares per order' }),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 5.50,
        required: false,
        description: 'Limit price for limit orders (0.01-1000.00 GHS)',
        minimum: 0.01,
        maximum: 1000
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({ maxDecimalPlaces: 4 }, { message: 'Price must be a valid number with max 4 decimal places' }),
    (0, class_validator_1.Min)(0.01, { message: 'Price must be at least 0.01 GHS' }),
    (0, class_validator_1.Max)(1000, { message: 'Price cannot exceed 1000 GHS' }),
    __metadata("design:type", Number)
], CreateOrderDto.prototype, "limitPrice", void 0);
//# sourceMappingURL=create-order.dto.js.map
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const wallet_service_1 = require("./wallet.service");
class DepositDto {
}
__decorate([
    (0, swagger_2.ApiProperty)({ example: 500 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(10),
    __metadata("design:type", Number)
], DepositDto.prototype, "amount", void 0);
class WithdrawDto {
}
__decorate([
    (0, swagger_2.ApiProperty)({ example: 200 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(10),
    __metadata("design:type", Number)
], WithdrawDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ example: '030100' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WithdrawDto.prototype, "bankCode", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ example: '0241234567' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WithdrawDto.prototype, "accountNumber", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ example: 'Kofi Mensah' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WithdrawDto.prototype, "accountName", void 0);
let WalletController = class WalletController {
    constructor(walletService) {
        this.walletService = walletService;
    }
    async getWallet(req) {
        return this.walletService.getWallet(req.user.id);
    }
    async deposit(req, dto) {
        return this.walletService.initiateDeposit(req.user.id, dto.amount, req.user.email);
    }
    async verifyDeposit(reference) {
        return this.walletService.verifyDeposit(reference);
    }
    async withdraw(req, dto) {
        return this.walletService.initiateWithdrawal(req.user.id, dto.amount, dto.bankCode, dto.accountNumber, dto.accountName);
    }
    async getTransactions(req) {
        return this.walletService.getTransactions(req.user.id);
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get wallet balance and info' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getWallet", null);
__decorate([
    (0, common_1.Post)('deposit'),
    (0, swagger_1.ApiOperation)({ summary: 'Initiate a deposit via Paystack (mobile money)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, DepositDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "deposit", null);
__decorate([
    (0, common_1.Get)('verify'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify a deposit after Paystack redirect' }),
    __param(0, (0, common_1.Query)('reference')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "verifyDeposit", null);
__decorate([
    (0, common_1.Post)('withdraw'),
    (0, swagger_1.ApiOperation)({ summary: 'Withdraw funds to bank/mobile money' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, WithdrawDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "withdraw", null);
__decorate([
    (0, common_1.Get)('transactions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get transaction history' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getTransactions", null);
exports.WalletController = WalletController = __decorate([
    (0, swagger_1.ApiTags)('Wallet'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('wallet'),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map
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
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const config_1 = require("@nestjs/config");
const supabase_service_1 = require("../supabase/supabase.service");
const uuid_1 = require("uuid");
let WalletService = class WalletService {
    constructor(supabase, config) {
        this.supabase = supabase;
        this.config = config;
        this.paystackBaseUrl = 'https://api.paystack.co';
    }
    async getWallet(userId) {
        const client = this.supabase.getAdminClient();
        const { data, error } = await client
            .from('wallets')
            .select('*')
            .eq('user_id', userId)
            .single();
        if (error)
            throw new common_1.NotFoundException('Wallet not found');
        return this.mapWallet(data);
    }
    async initiateDeposit(userId, amount, email) {
        if (amount < 10)
            throw new common_1.BadRequestException('Minimum deposit is GHS 10');
        const reference = `GSE-DEP-${(0, uuid_1.v4)()}`;
        const client = this.supabase.getAdminClient();
        const response = await axios_1.default.post(`${this.paystackBaseUrl}/transaction/initialize`, {
            email,
            amount: Math.round(amount * 100),
            reference,
            currency: 'GHS',
            callback_url: `${this.config.get('FRONTEND_URL')}/wallet/verify`,
            metadata: { userId, type: 'deposit' },
        }, {
            headers: {
                Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
                'Content-Type': 'application/json',
            },
        });
        const wallet = await this.getWallet(userId);
        await client.from('transactions').insert({
            wallet_id: wallet.id,
            type: 'deposit',
            amount,
            status: 'pending',
            reference,
            description: `Deposit of GHS ${amount}`,
        });
        return {
            authorizationUrl: response.data.data.authorization_url,
            reference,
            amount,
        };
    }
    async verifyDeposit(reference) {
        const client = this.supabase.getAdminClient();
        const { data: tx, error } = await client
            .from('transactions')
            .select('*, wallets(*)')
            .eq('reference', reference)
            .single();
        if (error)
            throw new common_1.NotFoundException('Transaction not found');
        if (tx.status === 'completed') {
            return { success: true, message: 'Already verified' };
        }
        const response = await axios_1.default.get(`${this.paystackBaseUrl}/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
            },
        });
        const data = response.data.data;
        if (data.status === 'success') {
            await client
                .from('transactions')
                .update({ status: 'completed' })
                .eq('id', tx.id);
            await client
                .from('wallets')
                .update({
                balance: Number(tx.wallets.balance) + Number(tx.amount)
            })
                .eq('id', tx.wallet_id);
            return { success: true, message: `GHS ${tx.amount} credited to your wallet` };
        }
        else {
            await client
                .from('transactions')
                .update({ status: 'failed' })
                .eq('id', tx.id);
            return { success: false, message: 'Payment verification failed' };
        }
    }
    async initiateWithdrawal(userId, amount, bankCode, accountNumber, accountName) {
        const client = this.supabase.getAdminClient();
        const wallet = await this.getWallet(userId);
        const available = Number(wallet.balance) - Number(wallet.lockedBalance);
        if (available < amount) {
            throw new common_1.BadRequestException(`Insufficient balance. Available: GHS ${available.toFixed(2)}`);
        }
        const reference = `GSE-WIT-${(0, uuid_1.v4)()}`;
        const recipientRes = await axios_1.default.post(`${this.paystackBaseUrl}/transferrecipient`, {
            type: 'ghipss',
            name: accountName,
            account_number: accountNumber,
            bank_code: bankCode,
            currency: 'GHS',
        }, {
            headers: {
                Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
            },
        });
        const recipientCode = recipientRes.data.data.recipient_code;
        await axios_1.default.post(`${this.paystackBaseUrl}/transfer`, {
            source: 'balance',
            amount: Math.round(amount * 100),
            recipient: recipientCode,
            reason: 'GSE Trading withdrawal',
            reference,
        }, {
            headers: {
                Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
            },
        });
        await client
            .from('wallets')
            .update({
            locked_balance: Number(wallet.lockedBalance) + amount
        })
            .eq('id', wallet.id);
        await client.from('transactions').insert({
            wallet_id: wallet.id,
            type: 'withdrawal',
            amount,
            status: 'pending',
            reference,
            description: `Withdrawal of GHS ${amount} to ${accountName}`,
        });
        return { reference, message: 'Withdrawal initiated successfully' };
    }
    async getTransactions(userId) {
        const client = this.supabase.getAdminClient();
        const wallet = await this.getWallet(userId);
        const { data, error } = await client
            .from('transactions')
            .select('*')
            .eq('wallet_id', wallet.id)
            .order('created_at', { ascending: false });
        if (error)
            throw new Error(error.message);
        return data.map(this.mapTransaction);
    }
    mapWallet(data) {
        return {
            id: data.id,
            userId: data.user_id,
            balance: data.balance,
            lockedBalance: data.locked_balance,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    }
    mapTransaction(data) {
        return {
            id: data.id,
            walletId: data.wallet_id,
            type: data.type,
            amount: data.amount,
            status: data.status,
            reference: data.reference,
            description: data.description,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        config_1.ConfigService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map
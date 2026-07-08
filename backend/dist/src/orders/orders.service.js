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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const gse_service_1 = require("../gse/gse.service");
const BROKERAGE_FEE_RATE = 0.005;
let OrdersService = class OrdersService {
    constructor(supabase, gseService) {
        this.supabase = supabase;
        this.gseService = gseService;
    }
    async createOrder(user, dto) {
        const client = this.supabase.getAdminClient();
        const currentPrice = this.gseService.getCurrentPrice(dto.symbol);
        if (!currentPrice) {
            throw new common_1.BadRequestException(`Symbol ${dto.symbol} not found on GSE`);
        }
        if (dto.type === 'limit' && !dto.limitPrice) {
            throw new common_1.BadRequestException('Limit price required for limit orders');
        }
        const executionPrice = dto.type === 'market' ? currentPrice : dto.limitPrice;
        const totalValue = executionPrice * dto.quantity;
        const fees = totalValue * BROKERAGE_FEE_RATE;
        const totalCost = totalValue + fees;
        const { data: wallet, error: walletError } = await client
            .from('wallets')
            .select('*')
            .eq('user_id', user.id)
            .single();
        if (walletError)
            throw new common_1.BadRequestException('Wallet not found');
        if (dto.side === 'buy') {
            const available = Number(wallet.balance) - Number(wallet.locked_balance);
            if (available < totalCost) {
                throw new common_1.BadRequestException(`Insufficient funds. Required: GHS ${totalCost.toFixed(2)}, Available: GHS ${available.toFixed(2)}`);
            }
            await client
                .from('wallets')
                .update({
                locked_balance: Number(wallet.locked_balance) + totalCost
            })
                .eq('id', wallet.id);
        }
        else {
            const { data: holding } = await client
                .from('portfolio')
                .select('*')
                .eq('user_id', user.id)
                .eq('symbol', dto.symbol.toUpperCase())
                .single();
            if (!holding || holding.quantity < dto.quantity) {
                throw new common_1.BadRequestException(`Insufficient shares. You own ${holding?.quantity || 0} shares of ${dto.symbol}`);
            }
        }
        const { data: order, error: orderError } = await client
            .from('orders')
            .insert({
            user_id: user.id,
            symbol: dto.symbol.toUpperCase(),
            type: dto.type,
            side: dto.side,
            quantity: dto.quantity,
            limit_price: dto.limitPrice,
            status: dto.type === 'market' ? 'pending' : 'open',
            fees,
        })
            .select()
            .single();
        if (orderError)
            throw new Error(orderError.message);
        if (dto.type === 'market') {
            await this.executeOrder(order.id, executionPrice);
            const { data: updatedOrder } = await client
                .from('orders')
                .select('*')
                .eq('id', order.id)
                .single();
            return this.mapOrder(updatedOrder);
        }
        return this.mapOrder(order);
    }
    async executeOrder(orderId, price) {
        const client = this.supabase.getAdminClient();
        const { data: order } = await client
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
        if (!order)
            return;
        const totalValue = price * order.quantity;
        const fees = totalValue * BROKERAGE_FEE_RATE;
        await client
            .from('orders')
            .update({
            filled_price: price,
            filled_quantity: order.quantity,
            total_value: totalValue,
            fees,
            status: 'filled',
        })
            .eq('id', orderId);
        const { data: wallet } = await client
            .from('wallets')
            .select('*')
            .eq('user_id', order.user_id)
            .single();
        if (order.side === 'buy') {
            const totalCost = totalValue + fees;
            await client
                .from('wallets')
                .update({
                balance: Number(wallet.balance) - totalCost,
                locked_balance: Math.max(0, Number(wallet.locked_balance) - totalCost),
            })
                .eq('id', wallet.id);
            const { data: holding } = await client
                .from('portfolio')
                .select('*')
                .eq('user_id', order.user_id)
                .eq('symbol', order.symbol)
                .single();
            if (holding) {
                const newTotalCost = Number(holding.total_cost) + totalValue;
                const newQuantity = holding.quantity + order.quantity;
                await client
                    .from('portfolio')
                    .update({
                    average_cost: newTotalCost / newQuantity,
                    quantity: newQuantity,
                    total_cost: newTotalCost,
                })
                    .eq('id', holding.id);
            }
            else {
                await client.from('portfolio').insert({
                    user_id: order.user_id,
                    symbol: order.symbol,
                    quantity: order.quantity,
                    average_cost: price,
                    total_cost: totalValue,
                });
            }
            await client.from('transactions').insert({
                wallet_id: wallet.id,
                type: 'buy_order',
                amount: totalCost,
                status: 'completed',
                reference: order.id,
                description: `Bought ${order.quantity} shares of ${order.symbol} @ GHS ${price}`,
            });
        }
        else {
            const proceeds = totalValue - fees;
            await client
                .from('wallets')
                .update({
                balance: Number(wallet.balance) + proceeds,
            })
                .eq('id', wallet.id);
            const { data: holding } = await client
                .from('portfolio')
                .select('*')
                .eq('user_id', order.user_id)
                .eq('symbol', order.symbol)
                .single();
            if (holding) {
                const newQuantity = holding.quantity - order.quantity;
                if (newQuantity === 0) {
                    await client
                        .from('portfolio')
                        .delete()
                        .eq('id', holding.id);
                }
                else {
                    await client
                        .from('portfolio')
                        .update({
                        quantity: newQuantity,
                        total_cost: holding.average_cost * newQuantity,
                    })
                        .eq('id', holding.id);
                }
            }
            await client.from('transactions').insert({
                wallet_id: wallet.id,
                type: 'sell_order',
                amount: proceeds,
                status: 'completed',
                reference: order.id,
                description: `Sold ${order.quantity} shares of ${order.symbol} @ GHS ${price}`,
            });
        }
    }
    async cancelOrder(user, orderId) {
        const client = this.supabase.getAdminClient();
        const { data: order, error } = await client
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
        if (error)
            throw new common_1.NotFoundException('Order not found');
        if (order.user_id !== user.id)
            throw new common_1.ForbiddenException();
        if (order.status !== 'open') {
            throw new common_1.BadRequestException('Only open orders can be cancelled');
        }
        await client
            .from('orders')
            .update({
            status: 'cancelled',
            cancel_reason: 'Cancelled by user',
        })
            .eq('id', orderId);
        if (order.side === 'buy') {
            const { data: wallet } = await client
                .from('wallets')
                .select('*')
                .eq('user_id', user.id)
                .single();
            const lockedAmount = order.limit_price * order.quantity * (1 + BROKERAGE_FEE_RATE);
            await client
                .from('wallets')
                .update({
                locked_balance: Math.max(0, Number(wallet.locked_balance) - lockedAmount),
            })
                .eq('id', wallet.id);
        }
        const { data: updatedOrder } = await client
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
        return this.mapOrder(updatedOrder);
    }
    async getUserOrders(userId, status) {
        const client = this.supabase.getAdminClient();
        let query = client
            .from('orders')
            .select('*')
            .eq('user_id', userId);
        if (status) {
            query = query.eq('status', status);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error)
            throw new Error(error.message);
        return data.map(this.mapOrder);
    }
    async getOrderById(userId, orderId) {
        const client = this.supabase.getAdminClient();
        const { data, error } = await client
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .eq('user_id', userId)
            .single();
        if (error)
            throw new common_1.NotFoundException('Order not found');
        return this.mapOrder(data);
    }
    mapOrder(data) {
        return {
            id: data.id,
            userId: data.user_id,
            symbol: data.symbol,
            type: data.type,
            side: data.side,
            quantity: data.quantity,
            limitPrice: data.limit_price,
            filledPrice: data.filled_price,
            filledQuantity: data.filled_quantity,
            totalValue: data.total_value,
            fees: data.fees,
            status: data.status,
            cancelReason: data.cancel_reason,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        gse_service_1.GseService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map
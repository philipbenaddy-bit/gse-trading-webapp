import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { GseService } from '../gse/gse.service';
import { CreateOrderDto } from './dto/create-order.dto';

const BROKERAGE_FEE_RATE = 0.005; // 0.5%

@Injectable()
export class OrdersService {
  constructor(
    private supabase: SupabaseService,
    private gseService: GseService,
  ) {}

  async createOrder(user: any, dto: CreateOrderDto) {
    // Use admin client to bypass RLS for server-side operations
    const client = this.supabase.getAdminClient();
    const currentPrice = this.gseService.getCurrentPrice(dto.symbol);
    
    if (!currentPrice) {
      throw new BadRequestException(`Symbol ${dto.symbol} not found on GSE`);
    }

    if (dto.type === 'limit' && !dto.limitPrice) {
      throw new BadRequestException('Limit price required for limit orders');
    }

    const executionPrice = dto.type === 'market' ? currentPrice : dto.limitPrice;
    const totalValue = executionPrice * dto.quantity;
    const fees = totalValue * BROKERAGE_FEE_RATE;
    const totalCost = totalValue + fees;

    // Get wallet
    const { data: wallet, error: walletError } = await client
      .from('wallets')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (walletError) throw new BadRequestException('Wallet not found');

    if (dto.side === 'buy') {
      const available = Number(wallet.balance) - Number(wallet.locked_balance);
      if (available < totalCost) {
        throw new BadRequestException(
          `Insufficient funds. Required: GHS ${totalCost.toFixed(2)}, Available: GHS ${available.toFixed(2)}`,
        );
      }
      
      // Lock funds
      await client
        .from('wallets')
        .update({ 
          locked_balance: Number(wallet.locked_balance) + totalCost 
        })
        .eq('id', wallet.id);
    } else {
      // SELL — check portfolio
      const { data: holding } = await client
        .from('portfolio')
        .select('*')
        .eq('user_id', user.id)
        .eq('symbol', dto.symbol.toUpperCase())
        .single();

      if (!holding || holding.quantity < dto.quantity) {
        throw new BadRequestException(
          `Insufficient shares. You own ${holding?.quantity || 0} shares of ${dto.symbol}`,
        );
      }
    }

    // Create order
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

    if (orderError) throw new Error(orderError.message);

    // For market orders, execute immediately
    if (dto.type === 'market') {
      await this.executeOrder(order.id, executionPrice);
      // Refetch to get updated order
      const { data: updatedOrder } = await client
        .from('orders')
        .select('*')
        .eq('id', order.id)
        .single();
      return this.mapOrder(updatedOrder);
    }

    return this.mapOrder(order);
  }

  private async executeOrder(orderId: string, price: number) {
    // Use admin client to bypass RLS for server-side operations
    const client = this.supabase.getAdminClient();
    
    const { data: order } = await client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (!order) return;

    const totalValue = price * order.quantity;
    const fees = totalValue * BROKERAGE_FEE_RATE;

    // Update order
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
      
      // Update wallet
      await client
        .from('wallets')
        .update({
          balance: Number(wallet.balance) - totalCost,
          locked_balance: Math.max(0, Number(wallet.locked_balance) - totalCost),
        })
        .eq('id', wallet.id);

      // Update portfolio
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
      } else {
        await client.from('portfolio').insert({
          user_id: order.user_id,
          symbol: order.symbol,
          quantity: order.quantity,
          average_cost: price,
          total_cost: totalValue,
        });
      }

      // Record transaction
      await client.from('transactions').insert({
        wallet_id: wallet.id,
        type: 'buy_order',
        amount: totalCost,
        status: 'completed',
        reference: order.id,
        description: `Bought ${order.quantity} shares of ${order.symbol} @ GHS ${price}`,
      });
    } else {
      // SELL
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
        } else {
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

  async cancelOrder(user: any, orderId: string) {
    // Use admin client to bypass RLS for server-side operations
    const client = this.supabase.getAdminClient();
    
    const { data: order, error } = await client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) throw new NotFoundException('Order not found');
    if (order.user_id !== user.id) throw new ForbiddenException();
    if (order.status !== 'open') {
      throw new BadRequestException('Only open orders can be cancelled');
    }

    await client
      .from('orders')
      .update({
        status: 'cancelled',
        cancel_reason: 'Cancelled by user',
      })
      .eq('id', orderId);

    // Unlock funds for buy orders
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

  async getUserOrders(userId: string, status?: string) {
    // Use admin client to bypass RLS for server-side operations
    const client = this.supabase.getAdminClient();
    
    let query = client
      .from('orders')
      .select('*')
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data.map(this.mapOrder);
  }

  async getOrderById(userId: string, orderId: string) {
    // Use admin client to bypass RLS for server-side operations
    const client = this.supabase.getAdminClient();
    
    const { data, error } = await client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (error) throw new NotFoundException('Order not found');
    return this.mapOrder(data);
  }

  private mapOrder(data: any) {
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
}

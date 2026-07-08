import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WalletService {
  private readonly paystackBaseUrl = 'https://api.paystack.co';

  constructor(
    private supabase: SupabaseService,
    private config: ConfigService,
  ) {}

  async getWallet(userId: string) {
    // Use admin client to bypass RLS for server-side operations
    const client = this.supabase.getAdminClient();
    const { data, error } = await client
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw new NotFoundException('Wallet not found');
    return this.mapWallet(data);
  }

  async initiateDeposit(userId: string, amount: number, email: string) {
    if (amount < 10) throw new BadRequestException('Minimum deposit is GHS 10');

    const reference = `GSE-DEP-${uuidv4()}`;
    // Use admin client to bypass RLS for server-side operations
    const client = this.supabase.getAdminClient();

    // Initialize Paystack transaction
    const response = await axios.post(
      `${this.paystackBaseUrl}/transaction/initialize`,
      {
        email,
        amount: Math.round(amount * 100), // Paystack uses pesewas
        reference,
        currency: 'GHS',
        callback_url: `${this.config.get('FRONTEND_URL')}/wallet/verify`,
        metadata: { userId, type: 'deposit' },
      },
      {
        headers: {
          Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
          'Content-Type': 'application/json',
        },
      },
    );

    // Record pending transaction
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

  async verifyDeposit(reference: string): Promise<{ success: boolean; message: string }> {
    // Use admin client to bypass RLS for server-side operations
    const client = this.supabase.getAdminClient();
    
    const { data: tx, error } = await client
      .from('transactions')
      .select('*, wallets(*)')
      .eq('reference', reference)
      .single();

    if (error) throw new NotFoundException('Transaction not found');
    if (tx.status === 'completed') {
      return { success: true, message: 'Already verified' };
    }

    // Verify with Paystack
    const response = await axios.get(
      `${this.paystackBaseUrl}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
        },
      },
    );

    const data = response.data.data;
    if (data.status === 'success') {
      // Update transaction
      await client
        .from('transactions')
        .update({ status: 'completed' })
        .eq('id', tx.id);

      // Credit wallet
      await client
        .from('wallets')
        .update({ 
          balance: Number(tx.wallets.balance) + Number(tx.amount) 
        })
        .eq('id', tx.wallet_id);

      return { success: true, message: `GHS ${tx.amount} credited to your wallet` };
    } else {
      await client
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', tx.id);
      return { success: false, message: 'Payment verification failed' };
    }
  }

  async initiateWithdrawal(
    userId: string,
    amount: number,
    bankCode: string,
    accountNumber: string,
    accountName: string,
  ) {
    // Use admin client to bypass RLS for server-side operations
    const client = this.supabase.getAdminClient();
    const wallet = await this.getWallet(userId);

    const available = Number(wallet.balance) - Number(wallet.lockedBalance);
    if (available < amount) {
      throw new BadRequestException(`Insufficient balance. Available: GHS ${available.toFixed(2)}`);
    }

    const reference = `GSE-WIT-${uuidv4()}`;

    // Create transfer recipient on Paystack
    const recipientRes = await axios.post(
      `${this.paystackBaseUrl}/transferrecipient`,
      {
        type: 'ghipss',
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'GHS',
      },
      {
        headers: {
          Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
        },
      },
    );

    const recipientCode = recipientRes.data.data.recipient_code;

    // Initiate transfer
    await axios.post(
      `${this.paystackBaseUrl}/transfer`,
      {
        source: 'balance',
        amount: Math.round(amount * 100),
        recipient: recipientCode,
        reason: 'GSE Trading withdrawal',
        reference,
      },
      {
        headers: {
          Authorization: `Bearer ${this.config.get('PAYSTACK_SECRET_KEY')}`,
        },
      },
    );

    // Lock funds and record transaction
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

  async getTransactions(userId: string) {
    // Use admin client to bypass RLS for server-side operations
    const client = this.supabase.getAdminClient();
    const wallet = await this.getWallet(userId);

    const { data, error } = await client
      .from('transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data.map(this.mapTransaction);
  }

  private mapWallet(data: any) {
    return {
      id: data.id,
      userId: data.user_id,
      balance: data.balance,
      lockedBalance: data.locked_balance,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapTransaction(data: any) {
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
}

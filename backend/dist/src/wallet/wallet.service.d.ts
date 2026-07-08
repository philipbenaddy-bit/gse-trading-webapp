import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
export declare class WalletService {
    private supabase;
    private config;
    private readonly paystackBaseUrl;
    constructor(supabase: SupabaseService, config: ConfigService);
    getWallet(userId: string): Promise<{
        id: any;
        userId: any;
        balance: any;
        lockedBalance: any;
        createdAt: any;
        updatedAt: any;
    }>;
    initiateDeposit(userId: string, amount: number, email: string): Promise<{
        authorizationUrl: any;
        reference: string;
        amount: number;
    }>;
    verifyDeposit(reference: string): Promise<{
        success: boolean;
        message: string;
    }>;
    initiateWithdrawal(userId: string, amount: number, bankCode: string, accountNumber: string, accountName: string): Promise<{
        reference: string;
        message: string;
    }>;
    getTransactions(userId: string): Promise<{
        id: any;
        walletId: any;
        type: any;
        amount: any;
        status: any;
        reference: any;
        description: any;
        createdAt: any;
        updatedAt: any;
    }[]>;
    private mapWallet;
    private mapTransaction;
}

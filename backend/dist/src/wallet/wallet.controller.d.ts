import { WalletService } from './wallet.service';
declare class DepositDto {
    amount: number;
}
declare class WithdrawDto {
    amount: number;
    bankCode: string;
    accountNumber: string;
    accountName: string;
}
export declare class WalletController {
    private walletService;
    constructor(walletService: WalletService);
    getWallet(req: any): Promise<{
        id: any;
        userId: any;
        balance: any;
        lockedBalance: any;
        createdAt: any;
        updatedAt: any;
    }>;
    deposit(req: any, dto: DepositDto): Promise<{
        authorizationUrl: any;
        reference: string;
        amount: number;
    }>;
    verifyDeposit(reference: string): Promise<{
        success: boolean;
        message: string;
    }>;
    withdraw(req: any, dto: WithdrawDto): Promise<{
        reference: string;
        message: string;
    }>;
    getTransactions(req: any): Promise<{
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
}
export {};

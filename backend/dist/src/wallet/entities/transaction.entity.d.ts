import { Wallet } from './wallet.entity';
export declare enum TransactionType {
    DEPOSIT = "deposit",
    WITHDRAWAL = "withdrawal",
    BUY_ORDER = "buy_order",
    SELL_ORDER = "sell_order",
    ORDER_REFUND = "order_refund"
}
export declare enum TransactionStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed"
}
export declare class Transaction {
    id: string;
    wallet: Wallet;
    type: TransactionType;
    amount: number;
    status: TransactionStatus;
    reference: string;
    description: string;
    metadata: Record<string, any>;
    createdAt: Date;
}

import { User } from '../../users/entities/user.entity';
import { Transaction } from './transaction.entity';
export declare class Wallet {
    id: string;
    user: User;
    balance: number;
    lockedBalance: number;
    transactions: Transaction[];
    createdAt: Date;
    updatedAt: Date;
}

import { User } from '../../users/entities/user.entity';
export declare class Portfolio {
    id: string;
    user: User;
    symbol: string;
    quantity: number;
    averageCost: number;
    totalCost: number;
    createdAt: Date;
    updatedAt: Date;
}

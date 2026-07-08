import { User } from '../../users/entities/user.entity';
export declare enum OrderType {
    MARKET = "market",
    LIMIT = "limit"
}
export declare enum OrderSide {
    BUY = "buy",
    SELL = "sell"
}
export declare enum OrderStatus {
    PENDING = "pending",
    OPEN = "open",
    FILLED = "filled",
    PARTIALLY_FILLED = "partially_filled",
    CANCELLED = "cancelled",
    REJECTED = "rejected"
}
export declare class Order {
    id: string;
    user: User;
    symbol: string;
    type: OrderType;
    side: OrderSide;
    quantity: number;
    limitPrice: number;
    filledPrice: number;
    filledQuantity: number;
    status: OrderStatus;
    totalValue: number;
    fees: number;
    cancelReason: string;
    createdAt: Date;
    updatedAt: Date;
}

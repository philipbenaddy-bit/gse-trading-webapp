import { OrderType, OrderSide } from '../entities/order.entity';
export declare class CreateOrderDto {
    symbol: string;
    type: OrderType;
    side: OrderSide;
    quantity: number;
    limitPrice?: number;
}

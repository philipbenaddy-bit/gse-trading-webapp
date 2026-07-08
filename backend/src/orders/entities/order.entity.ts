import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum OrderType {
  MARKET = 'market',
  LIMIT = 'limit',
}

export enum OrderSide {
  BUY = 'buy',
  SELL = 'sell',
}

export enum OrderStatus {
  PENDING = 'pending',
  OPEN = 'open',
  FILLED = 'filled',
  PARTIALLY_FILLED = 'partially_filled',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn()
  user: User;

  @Column()
  symbol: string; // GSE ticker e.g. "GCB", "MTN"

  @Column({ type: 'enum', enum: OrderType })
  type: OrderType;

  @Column({ type: 'enum', enum: OrderSide })
  side: OrderSide;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  limitPrice: number; // null for market orders

  @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
  filledPrice: number; // average fill price

  @Column({ type: 'int', default: 0 })
  filledQuantity: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalValue: number; // filledPrice * filledQuantity

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  fees: number; // brokerage fees (0.5% of trade value)

  @Column({ nullable: true })
  cancelReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

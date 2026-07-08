import { IsString, IsEnum, IsInt, IsOptional, IsNumber, Min, Max, Matches, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { OrderType, OrderSide } from '../entities/order.entity';
import { ToUpperCase, Sanitize } from '../../common/pipes/sanitization.pipe';

export class CreateOrderDto {
  @ApiProperty({ 
    example: 'GCB',
    description: 'GSE stock symbol (2-4 characters, uppercase)',
    minLength: 2,
    maxLength: 4
  })
  @IsString()
  @Length(2, 4, { message: 'Symbol must be between 2 and 4 characters' })
  @Matches(/^[A-Z]+$/, { message: 'Symbol must contain only uppercase letters' })
  @ToUpperCase()
  @Sanitize()
  symbol: string;

  @ApiProperty({ 
    enum: OrderType,
    description: 'Order type: market or limit'
  })
  @IsEnum(OrderType, { message: 'Type must be either market or limit' })
  type: OrderType;

  @ApiProperty({ 
    enum: OrderSide,
    description: 'Order side: buy or sell'
  })
  @IsEnum(OrderSide, { message: 'Side must be either buy or sell' })
  side: OrderSide;

  @ApiProperty({ 
    example: 100,
    description: 'Number of shares to trade (1-10,000)',
    minimum: 1,
    maximum: 10000
  })
  @IsInt({ message: 'Quantity must be a whole number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @Max(10000, { message: 'Quantity cannot exceed 10,000 shares per order' })
  quantity: number;

  @ApiProperty({ 
    example: 5.50,
    required: false,
    description: 'Limit price for limit orders (0.01-1000.00 GHS)',
    minimum: 0.01,
    maximum: 1000
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 }, { message: 'Price must be a valid number with max 4 decimal places' })
  @Min(0.01, { message: 'Price must be at least 0.01 GHS' })
  @Max(1000, { message: 'Price cannot exceed 1000 GHS' })
  limitPrice?: number;
}

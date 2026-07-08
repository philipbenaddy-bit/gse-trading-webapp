import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './entities/order.entity';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Place a new buy or sell order' })
  async createOrder(@Request() req, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders for current user' })
  @ApiQuery({ name: 'status', enum: OrderStatus, required: false })
  async getOrders(@Request() req, @Query('status') status?: OrderStatus) {
    return this.ordersService.getUserOrders(req.user.id, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific order' })
  async getOrder(@Request() req, @Param('id') id: string) {
    return this.ordersService.getOrderById(req.user.id, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel an open order' })
  async cancelOrder(@Request() req, @Param('id') id: string) {
    return this.ordersService.cancelOrder(req.user, id);
  }
}

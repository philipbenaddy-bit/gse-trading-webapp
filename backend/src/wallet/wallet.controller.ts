import { Controller, Get, Post, Body, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WalletService } from './wallet.service';

class DepositDto {
  @ApiProperty({ example: 500 })
  @IsNumber()
  @Min(10)
  amount: number;
}

class WithdrawDto {
  @ApiProperty({ example: 200 })
  @IsNumber()
  @Min(10)
  amount: number;

  @ApiProperty({ example: '030100' })
  @IsString()
  bankCode: string;

  @ApiProperty({ example: '0241234567' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ example: 'Kofi Mensah' })
  @IsString()
  accountName: string;
}

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get wallet balance and info' })
  async getWallet(@Request() req) {
    return this.walletService.getWallet(req.user.id);
  }

  @Post('deposit')
  @ApiOperation({ summary: 'Initiate a deposit via Paystack (mobile money)' })
  async deposit(@Request() req, @Body() dto: DepositDto) {
    return this.walletService.initiateDeposit(req.user.id, dto.amount, req.user.email);
  }

  @Get('verify')
  @ApiOperation({ summary: 'Verify a deposit after Paystack redirect' })
  async verifyDeposit(@Query('reference') reference: string) {
    return this.walletService.verifyDeposit(reference);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw funds to bank/mobile money' })
  async withdraw(@Request() req, @Body() dto: WithdrawDto) {
    return this.walletService.initiateWithdrawal(
      req.user.id,
      dto.amount,
      dto.bankCode,
      dto.accountNumber,
      dto.accountName,
    );
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  async getTransactions(@Request() req) {
    return this.walletService.getTransactions(req.user.id);
  }
}

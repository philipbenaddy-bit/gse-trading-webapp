import {
  Controller,
  Get,
  Patch,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('kyc')
  @ApiOperation({ summary: 'Submit KYC documents' })
  async submitKyc(
    @Request() req,
    @Body() body: { ghanaCardNumber: string; ghanaCardImageUrl?: string; selfieImageUrl?: string },
  ) {
    return this.usersService.updateKyc(req.user.id, body);
  }
}

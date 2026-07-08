import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MarketController } from './market.controller';
import { MarketGateway } from './market.gateway';
import { UsersModule } from '../users/users.module';
import { GseModule } from '../gse/gse.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '15m') },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    GseModule,
  ],
  controllers: [MarketController],
  providers: [MarketGateway],
  exports: [MarketGateway],
})
export class MarketModule {}

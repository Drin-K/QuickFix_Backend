import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StringValue } from 'ms';
import { Provider, Role, Tenant, User } from '../shared/entities';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

const jwtExpiresIn = (process.env.JWT_EXPIRES_IN ?? '1h') as StringValue;

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Tenant, Provider]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'quickfix-dev-secret',
      signOptions: {
        expiresIn: jwtExpiresIn,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [AuthService, JwtModule, JwtAuthGuard],
})
export class AuthModule {}

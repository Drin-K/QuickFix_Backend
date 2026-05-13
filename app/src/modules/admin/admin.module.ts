import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import {
  Booking,
  Provider,
  ProviderDocument,
  Service,
  User,
} from '../shared/entities';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminProvidersController } from './admin-providers.controller';
import { AdminProvidersService } from './admin-providers.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Booking,
      Provider,
      ProviderDocument,
      Service,
      User,
    ]),
  ],
  controllers: [AdminDashboardController, AdminProvidersController],
  providers: [AdminDashboardService, AdminProvidersService],
})
export class AdminModule {}

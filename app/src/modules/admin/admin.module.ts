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
import { AdminClientsController } from './admin-clients.controller';
import { AdminClientsService } from './admin-clients.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminProviderDocumentsController } from './admin-provider-documents.controller';
import { AdminProvidersController } from './admin-providers.controller';
import { AdminProvidersService } from './admin-providers.service';
import { AdminServicesController } from './admin-services.controller';
import { AdminServicesService } from './admin-services.service';

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
  controllers: [
    AdminClientsController,
    AdminDashboardController,
    AdminProviderDocumentsController,
    AdminProvidersController,
    AdminServicesController,
  ],
  providers: [
    AdminClientsService,
    AdminDashboardService,
    AdminProvidersService,
    AdminServicesService,
  ],
})
export class AdminModule {}

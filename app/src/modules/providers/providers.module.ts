import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import {
  Booking,
  BookingStatus,
  Provider,
  ProviderCompanyDetail,
  ProviderIndividualDetail,
} from '../shared/entities';
import { ProviderBookingsController } from './provider-bookings.controller';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Booking,
      BookingStatus,
      Provider,
      ProviderIndividualDetail,
      ProviderCompanyDetail,
    ]),
  ],
  controllers: [ProvidersController, ProviderBookingsController],
  providers: [ProvidersService],
})
export class ProvidersModule {}

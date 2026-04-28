import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AvailabilitySlot, Provider } from '../shared/entities';
import { ProviderAvailabilityController } from './provider-availability.controller';
import { ProviderAvailabilityService } from './provider-availability.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([AvailabilitySlot, Provider]),
  ],
  controllers: [ProviderAvailabilityController],
  providers: [ProviderAvailabilityService],
})
export class ProviderAvailabilityModule {}

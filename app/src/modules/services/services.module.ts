import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Category, Provider, Service } from '../shared/entities';
import { ProviderServicesController } from './provider-services.controller';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category, Provider, Service]),
    AuthModule,
  ],
  controllers: [ServicesController, ProviderServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}

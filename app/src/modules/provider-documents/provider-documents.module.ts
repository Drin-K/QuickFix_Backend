import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Provider, ProviderDocument } from '../shared/entities';
import { ProviderDocumentsController } from './provider-documents.controller';
import { ProviderDocumentsService } from './provider-documents.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Provider, ProviderDocument]),
  ],
  controllers: [ProviderDocumentsController],
  providers: [ProviderDocumentsService],
})
export class ProviderDocumentsModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { HealthModule } from './modules/health/health.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { ProviderAvailabilityModule } from './modules/provider-availability/provider-availability.module';
import { ProviderDocumentsModule } from './modules/provider-documents/provider-documents.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ServicesModule } from './modules/services/services.module';
import { TestConnectionModule } from './modules/test-connection/test-connection.module';
import { UsersModule } from './modules/users/users.module';
import { ProvidersModule } from './modules/providers/providers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    AdminModule,
    ServicesModule,
    BookingsModule,
    UsersModule,
    CategoriesModule,
    ConversationsModule,
    FavoritesModule,
    HealthModule,
    ProviderAvailabilityModule,
    ProviderDocumentsModule,
    ReviewsModule,
    TestConnectionModule,
    ProvidersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

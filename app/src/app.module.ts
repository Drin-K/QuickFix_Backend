import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { HealthModule } from './modules/health/health.module';
import { ProviderAvailabilityModule } from './modules/provider-availability/provider-availability.module';
import { ServicesModule } from './modules/services/services.module';
import { TestConnectionModule } from './modules/test-connection/test-connection.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    ServicesModule,
    BookingsModule,
    UsersModule,
    CategoriesModule,
    HealthModule,
    ProviderAvailabilityModule,
    TestConnectionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import {
  Booking,
  BookingStatus,
  BookingStatusHistory,
  Provider,
  Service,
  User,
} from '../shared/entities';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Booking,
      BookingStatus,
      BookingStatusHistory,
      Provider,
      Service,
      User,
    ]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Booking, Provider, Review } from '../shared/entities';
import { ProviderReviewsController } from './provider-reviews.controller';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Booking, Review, Provider])],
  controllers: [ReviewsController, ProviderReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RequestUser } from '../auth/jwt-auth.guard';
import { Booking, Provider, Review } from '../shared/entities';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(Review)
    private readonly reviewsRepository: Repository<Review>,
    @InjectRepository(Provider)
    private readonly providersRepository: Repository<Provider>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateReviewDto, user: RequestUser, tenantId: number) {
    if (user.role !== 'client') {
      throw new ForbiddenException('Only clients can create reviews');
    }

    const booking = await this.bookingsRepository.findOne({
      where: {
        id: dto.bookingId,
        tenantId,
        clientUserId: user.id,
      },
      relations: {
        status: true,
        provider: true,
        review: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found for the current client');
    }

    const statusName = booking.status?.name?.trim().toLowerCase();

    if (statusName !== 'completed') {
      throw new BadRequestException(
        'Reviews can only be created for completed bookings',
      );
    }

    if (booking.review) {
      throw new BadRequestException(
        'A review already exists for the selected booking',
      );
    }

    const createdReview = await this.dataSource.transaction(async (manager) => {
      const reviewsRepository = manager.getRepository(Review);
      const providersRepository = manager.getRepository(Provider);

      const review = reviewsRepository.create({
        tenantId,
        bookingId: booking.id,
        clientUserId: user.id,
        providerId: booking.providerId,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
      });

      const savedReview = await reviewsRepository.save(review);
      const averageRating = await this.calculateProviderAverageRating(
        booking.providerId,
        tenantId,
        reviewsRepository,
      );

      await providersRepository.update(
        {
          id: booking.providerId,
          tenantId,
        },
        {
          averageRating,
        },
      );

      return {
        savedReview,
        averageRating,
      };
    });

    return {
      id: createdReview.savedReview.id,
      tenantId: createdReview.savedReview.tenantId,
      bookingId: createdReview.savedReview.bookingId,
      clientUserId: createdReview.savedReview.clientUserId,
      providerId: createdReview.savedReview.providerId,
      rating: createdReview.savedReview.rating,
      comment: createdReview.savedReview.comment,
      createdAt: createdReview.savedReview.createdAt,
      provider: {
        id: booking.provider.id,
        displayName: booking.provider.displayName,
        averageRating: createdReview.averageRating,
      },
    };
  }

  private async calculateProviderAverageRating(
    providerId: number,
    tenantId: number,
    reviewsRepository: Repository<Review>,
  ): Promise<string | null> {
    const result = await reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'averageRating')
      .where('review.provider_id = :providerId', { providerId })
      .andWhere('review.tenant_id = :tenantId', { tenantId })
      .getRawOne<{ averageRating: string | null }>();

    if (!result?.averageRating) {
      return null;
    }

    return Number(result.averageRating).toFixed(2);
  }
}

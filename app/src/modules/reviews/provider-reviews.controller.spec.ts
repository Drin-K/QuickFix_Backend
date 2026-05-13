import { Test, TestingModule } from '@nestjs/testing';
import { ProviderReviewsController } from './provider-reviews.controller';
import { ReviewsService } from './reviews.service';

describe('ProviderReviewsController', () => {
  let controller: ProviderReviewsController;
  let reviewsService: {
    getProviderReviews: jest.Mock;
  };

  beforeEach(async () => {
    reviewsService = {
      getProviderReviews: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProviderReviewsController],
      providers: [
        {
          provide: ReviewsService,
          useValue: reviewsService,
        },
      ],
    }).compile();

    controller = module.get<ProviderReviewsController>(ProviderReviewsController);
  });

  it('returns public provider reviews', async () => {
    const response = {
      provider: {
        id: 5,
        displayName: 'QuickFix Plumbing',
        averageRating: '4.75',
      },
      summary: {
        averageRating: '4.75',
        count: 12,
      },
      reviews: [],
    };

    reviewsService.getProviderReviews.mockResolvedValue(response);

    await expect(controller.getProviderReviews(5)).resolves.toEqual(response);
    expect(reviewsService.getProviderReviews).toHaveBeenCalledWith(5);
  });
});

import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';

@ApiTags('Providers')
@Controller('providers')
export class ProviderReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':id/reviews')
  @ApiOperation({
    summary: 'List provider reviews',
    description:
      'Returns public reviews for one provider together with summary rating information.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Provider identifier.',
    example: 5,
  })
  @ApiOkResponse({
    description: 'Provider reviews returned successfully.',
    schema: {
      example: {
        provider: {
          id: 5,
          displayName: 'QuickFix Plumbing',
          averageRating: '4.75',
        },
        summary: {
          averageRating: '4.75',
          count: 12,
        },
        reviews: [
          {
            id: 3,
            rating: 5,
            comment: 'Great service and quick communication.',
            createdAt: '2026-05-13T18:00:00.000Z',
          },
        ],
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Provider was not found.',
  })
  getProviderReviews(@Param('id', ParseIntPipe) providerId: number) {
    return this.reviewsService.getProviderReviews(providerId);
  }
}

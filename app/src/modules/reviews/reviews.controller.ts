import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, RequestUser } from '../auth/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@ApiBearerAuth('bearer')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a review',
    description:
      'Creates a review for one completed booking that belongs to the authenticated client.',
  })
  @ApiHeader({
    name: 'x-tenant-id',
    required: false,
    description:
      'Tenant identifier. Required only when the authenticated token does not already contain tenant context.',
    schema: { type: 'integer', minimum: 1 },
  })
  @ApiBody({ type: CreateReviewDto })
  @ApiCreatedResponse({
    description: 'Review created successfully.',
    schema: {
      example: {
        id: 3,
        tenantId: 2,
        bookingId: 15,
        clientUserId: 9,
        providerId: 5,
        rating: 5,
        comment: 'Great service and quick communication.',
        createdAt: '2026-05-13T18:00:00.000Z',
        provider: {
          id: 5,
          displayName: 'QuickFix Plumbing',
          averageRating: '4.75',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed, tenant context is missing, booking is not completed, or the booking already has a review.',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication token is missing, invalid, or expired.',
  })
  @ApiForbiddenResponse({
    description: 'Only client accounts can create reviews.',
  })
  @ApiNotFoundResponse({
    description: 'Booking was not found for the authenticated client.',
  })
  create(
    @Body() dto: CreateReviewDto,
    @Req() request: Request,
    @CurrentUser() user: RequestUser,
  ) {
    const tenantId = this.resolveTenantId(request, user);
    return this.reviewsService.create(dto, user, tenantId);
  }

  private resolveTenantId(request: Request, user: RequestUser): number {
    if (user.tenantId) {
      return user.tenantId;
    }

    const tenantHeader = request.headers['x-tenant-id'];
    const tenantValue = Array.isArray(tenantHeader)
      ? tenantHeader[0]
      : tenantHeader;
    const tenantId = Number(tenantValue);

    if (!tenantValue || !Number.isInteger(tenantId) || tenantId <= 0) {
      throw new BadRequestException('Tenant context is required');
    }

    return tenantId;
  }
}

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

describe('ReviewsController', () => {
  let controller: ReviewsController;
  let reviewsService: {
    create: jest.Mock;
  };

  beforeEach(async () => {
    reviewsService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewsController],
      providers: [
        {
          provide: ReviewsService,
          useValue: reviewsService,
        },
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ReviewsController>(ReviewsController);
  });

  it('creates a review with tenant id from the authenticated user', async () => {
    const user = { id: 9, role: 'client', tenantId: 5 } as const;
    const dto = { bookingId: 15, rating: 5, comment: 'Great service' };
    const request = { headers: {} } as Request;

    reviewsService.create.mockResolvedValue({ id: 2 });

    await expect(controller.create(dto, request, user)).resolves.toEqual({
      id: 2,
    });
    expect(reviewsService.create).toHaveBeenCalledWith(dto, user, 5);
  });

  it('creates a review with tenant id from the header when missing in token', async () => {
    const user = { id: 9, role: 'client', tenantId: null } as const;
    const dto = { bookingId: 15, rating: 5 };
    const request = { headers: { 'x-tenant-id': '7' } } as unknown as Request;

    reviewsService.create.mockResolvedValue({ id: 3 });

    await expect(controller.create(dto, request, user)).resolves.toEqual({
      id: 3,
    });
    expect(reviewsService.create).toHaveBeenCalledWith(dto, user, 7);
  });
});

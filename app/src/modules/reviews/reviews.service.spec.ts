import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Booking, Provider, Review } from '../shared/entities';
import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let bookingsRepository: {
    findOne: jest.Mock;
  };
  let reviewsRepository: {
    find: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let providersRepository: {
    findOne: jest.Mock;
  };
  let dataSource: {
    transaction: jest.Mock;
  };

  beforeEach(async () => {
    bookingsRepository = {
      findOne: jest.fn(),
    };

    reviewsRepository = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    providersRepository = {
      findOne: jest.fn(),
    };

    dataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        {
          provide: getRepositoryToken(Booking),
          useValue: bookingsRepository,
        },
        {
          provide: getRepositoryToken(Review),
          useValue: reviewsRepository,
        },
        {
          provide: getRepositoryToken(Provider),
          useValue: providersRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  it('creates a review for the client completed booking and updates average rating', async () => {
    const user = { id: 9, role: 'client', tenantId: 2 } as const;
    const booking = {
      id: 15,
      tenantId: 2,
      clientUserId: 9,
      providerId: 5,
      status: { id: 3, name: 'completed' },
      provider: { id: 5, displayName: 'QuickFix Plumbing' },
      review: null,
    };
    const createReview = jest
      .fn()
      .mockImplementation((value: unknown) => value);
    const saveReview = jest.fn().mockResolvedValue({
      id: 3,
      tenantId: 2,
      bookingId: 15,
      clientUserId: 9,
      providerId: 5,
      rating: 5,
      comment: 'Great service',
      createdAt: new Date('2026-05-13T18:00:00.000Z'),
    });
    const updateProvider = jest.fn();
    const getRawOne = jest.fn().mockResolvedValue({ averageRating: '4.5' });
    const createQueryBuilder = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne,
    });

    bookingsRepository.findOne.mockResolvedValue(booking);

    type TestEntityManager = {
      getRepository: (entity: unknown) => {
        create?: jest.Mock;
        save?: jest.Mock;
        update?: jest.Mock;
        createQueryBuilder?: jest.Mock;
      };
    };

    type TransactionCallback = (manager: TestEntityManager) => Promise<unknown>;

    dataSource.transaction.mockImplementation((callback: TransactionCallback) =>
      callback({
        getRepository: (entity: unknown) => {
          if (entity === Review) {
            return {
              create: createReview,
              save: saveReview,
              createQueryBuilder,
            };
          }

          return {
            update: updateProvider,
          };
        },
      }),
    );

    await expect(
      service.create(
        { bookingId: 15, rating: 5, comment: 'Great service' },
        user,
        2,
      ),
    ).resolves.toEqual({
      id: 3,
      tenantId: 2,
      bookingId: 15,
      clientUserId: 9,
      providerId: 5,
      rating: 5,
      comment: 'Great service',
      createdAt: new Date('2026-05-13T18:00:00.000Z'),
      provider: {
        id: 5,
        displayName: 'QuickFix Plumbing',
        averageRating: '4.50',
      },
    });

    expect(createReview).toHaveBeenCalledWith({
      tenantId: 2,
      bookingId: 15,
      clientUserId: 9,
      providerId: 5,
      rating: 5,
      comment: 'Great service',
    });
    expect(updateProvider).toHaveBeenCalledWith(
      {
        id: 5,
        tenantId: 2,
      },
      {
        averageRating: '4.50',
      },
    );
  });

  it('rejects review creation for non-client users', async () => {
    const user = { id: 9, role: 'provider', tenantId: 2 } as const;

    await expect(
      service.create({ bookingId: 15, rating: 5 }, user, 2),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects review creation for a booking that does not belong to the client', async () => {
    const user = { id: 9, role: 'client', tenantId: 2 } as const;
    bookingsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.create({ bookingId: 15, rating: 5 }, user, 2),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects review creation when the booking is not completed', async () => {
    const user = { id: 9, role: 'client', tenantId: 2 } as const;
    bookingsRepository.findOne.mockResolvedValue({
      id: 15,
      tenantId: 2,
      clientUserId: 9,
      providerId: 5,
      status: { id: 1, name: 'confirmed' },
      provider: { id: 5, displayName: 'QuickFix Plumbing' },
      review: null,
    });

    await expect(
      service.create({ bookingId: 15, rating: 5 }, user, 2),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects review creation when a review already exists for the booking', async () => {
    const user = { id: 9, role: 'client', tenantId: 2 } as const;
    bookingsRepository.findOne.mockResolvedValue({
      id: 15,
      tenantId: 2,
      clientUserId: 9,
      providerId: 5,
      status: { id: 3, name: 'completed' },
      provider: { id: 5, displayName: 'QuickFix Plumbing' },
      review: { id: 4 },
    });

    await expect(
      service.create({ bookingId: 15, rating: 5 }, user, 2),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns provider reviews with summary information', async () => {
    providersRepository.findOne.mockResolvedValue({
      id: 5,
      tenantId: 2,
      displayName: 'QuickFix Plumbing',
      averageRating: '4.50',
    });
    reviewsRepository.find.mockResolvedValue([
      {
        id: 7,
        rating: 5,
        comment: 'Great service',
        createdAt: new Date('2026-05-13T18:00:00.000Z'),
      },
      {
        id: 4,
        rating: 4,
        comment: null,
        createdAt: new Date('2026-05-10T09:30:00.000Z'),
      },
    ]);

    await expect(service.getProviderReviews(5)).resolves.toEqual({
      provider: {
        id: 5,
        displayName: 'QuickFix Plumbing',
        averageRating: '4.50',
      },
      summary: {
        averageRating: '4.50',
        count: 2,
      },
      reviews: [
        {
          id: 7,
          rating: 5,
          comment: 'Great service',
          createdAt: new Date('2026-05-13T18:00:00.000Z'),
        },
        {
          id: 4,
          rating: 4,
          comment: null,
          createdAt: new Date('2026-05-10T09:30:00.000Z'),
        },
      ],
    });

    expect(reviewsRepository.find).toHaveBeenCalledWith({
      where: {
        providerId: 5,
        tenantId: 2,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  });

  it('rejects provider review listing when provider does not exist', async () => {
    providersRepository.findOne.mockResolvedValue(null);

    await expect(service.getProviderReviews(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

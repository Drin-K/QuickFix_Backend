import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Favorite, Provider } from '../shared/entities';
import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let favoritesRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let providersRepository: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    favoritesRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((value: unknown) => value),
      save: jest.fn(),
      remove: jest.fn(),
    };

    providersRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FavoritesService,
        {
          provide: getRepositoryToken(Favorite),
          useValue: favoritesRepository,
        },
        {
          provide: getRepositoryToken(Provider),
          useValue: providersRepository,
        },
      ],
    }).compile();

    service = module.get<FavoritesService>(FavoritesService);
  });

  it('returns client favorites with provider details', async () => {
    favoritesRepository.find.mockResolvedValue([
      {
        id: 11,
        providerId: 5,
        createdAt: new Date('2026-05-13T18:00:00.000Z'),
        provider: {
          id: 5,
          tenantId: 2,
          displayName: 'QuickFix Plumbing',
          description: 'Emergency plumbing specialists',
          isVerified: true,
          averageRating: '4.80',
        },
      },
    ]);

    await expect(
      service.getMyFavorites({ id: 9, role: 'client', tenantId: null }),
    ).resolves.toEqual({
      favorites: [
        {
          id: 11,
          providerId: 5,
          createdAt: new Date('2026-05-13T18:00:00.000Z'),
          provider: {
            id: 5,
            tenantId: 2,
            displayName: 'QuickFix Plumbing',
            description: 'Emergency plumbing specialists',
            isVerified: true,
            averageRating: '4.80',
          },
        },
      ],
    });
  });

  it('creates a favorite for a valid client provider pair', async () => {
    providersRepository.findOne.mockResolvedValue({
      id: 5,
      tenantId: 2,
      displayName: 'QuickFix Plumbing',
      description: 'Emergency plumbing specialists',
      isVerified: true,
      averageRating: '4.80',
    });
    favoritesRepository.findOne.mockResolvedValue(null);
    favoritesRepository.save.mockResolvedValue({
      id: 14,
      tenantId: 2,
      clientUserId: 9,
      providerId: 5,
      createdAt: new Date('2026-05-13T18:30:00.000Z'),
    });

    await expect(
      service.createFavorite(
        { providerId: 5 },
        { id: 9, role: 'client', tenantId: null },
      ),
    ).resolves.toEqual({
      message: 'Provider added to favorites successfully',
      favorite: {
        id: 14,
        providerId: 5,
        createdAt: new Date('2026-05-13T18:30:00.000Z'),
        provider: {
          id: 5,
          tenantId: 2,
          displayName: 'QuickFix Plumbing',
          description: 'Emergency plumbing specialists',
          isVerified: true,
          averageRating: '4.80',
        },
      },
    });

    expect(favoritesRepository.create).toHaveBeenCalledWith({
      tenantId: 2,
      clientUserId: 9,
      providerId: 5,
    });
  });

  it('rejects duplicate favorites', async () => {
    providersRepository.findOne.mockResolvedValue({
      id: 5,
      tenantId: 2,
    });
    favoritesRepository.findOne.mockResolvedValue({
      id: 14,
      provider: {
        id: 5,
        tenantId: 2,
        displayName: 'QuickFix Plumbing',
        description: null,
        isVerified: true,
        averageRating: '4.80',
      },
    });

    await expect(
      service.createFavorite(
        { providerId: 5 },
        { id: 9, role: 'client', tenantId: null },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects favorites for unknown providers', async () => {
    providersRepository.findOne.mockResolvedValue(null);

    await expect(
      service.createFavorite(
        { providerId: 999 },
        { id: 9, role: 'client', tenantId: null },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('removes an existing favorite', async () => {
    favoritesRepository.findOne.mockResolvedValue({
      id: 14,
      providerId: 5,
      provider: {
        id: 5,
        tenantId: 2,
        displayName: 'QuickFix Plumbing',
        description: null,
        isVerified: true,
        averageRating: '4.80',
      },
    });

    await expect(
      service.removeFavorite(5, { id: 9, role: 'client', tenantId: null }),
    ).resolves.toEqual({
      message: 'Provider removed from favorites successfully',
      providerId: 5,
    });

    expect(favoritesRepository.remove).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 14,
      }),
    );
  });

  it('rejects non-client users from managing favorites', async () => {
    await expect(
      service.getMyFavorites({ id: 9, role: 'provider', tenantId: 2 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

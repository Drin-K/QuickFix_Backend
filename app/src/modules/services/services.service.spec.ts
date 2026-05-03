import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RequestUser } from '../auth/jwt-auth.guard';
import { Category, Provider, Service } from '../shared/entities';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  let service: ServicesService;
  let repository: jest.Mocked<Repository<Service>>;
  let providersRepository: jest.Mocked<Repository<Provider>>;
  let categoriesRepository: jest.Mocked<Repository<Category>>;
  let dataSource: jest.Mocked<DataSource>;

  const providerUser: RequestUser = {
    id: 7,
    email: 'provider@test.com',
    role: 'provider',
    tenantId: 12,
  };

  const buildProvider = (isVerified: boolean): Provider =>
    ({
      id: 9,
      tenantId: 12,
      ownerUserId: providerUser.id,
      type: 'individual',
      displayName: 'QuickFix HVAC',
      description: 'Certified technicians',
      cityId: null,
      address: null,
      isVerified,
      averageRating: null,
    }) as Provider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getRepositoryToken(Service),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Provider),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            exists: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    repository = module.get(getRepositoryToken(Service));
    providersRepository = module.get(getRepositoryToken(Provider));
    categoriesRepository = module.get(getRepositoryToken(Category));
    dataSource = module.get(DataSource);
  });

  it('returns active tenant services mapped for list pages', async () => {
    repository.find.mockResolvedValue([
      {
        id: 5,
        tenantId: 12,
        title: 'AC Repair',
        description: 'Fixing AC units',
        basePrice: '49.99',
        isActive: true,
        createdAt: new Date('2026-04-20T10:00:00.000Z'),
        updatedAt: new Date('2026-04-21T10:00:00.000Z'),
        category: {
          id: 2,
          name: 'HVAC',
        },
        provider: {
          id: 9,
          displayName: 'QuickFix HVAC',
          description: 'Certified technicians',
        },
        images: [
          {
            id: 100,
            imageUrl: 'https://cdn.test/service-cover.jpg',
            sortOrder: 0,
          },
        ],
      },
    ] as Service[]);

    await expect(service.getServices(12)).resolves.toEqual({
      services: [
        {
          id: 5,
          tenantId: 12,
          title: 'AC Repair',
          description: 'Fixing AC units',
          basePrice: '49.99',
          isActive: true,
          category: {
            id: 2,
            name: 'HVAC',
          },
          provider: {
            id: 9,
            displayName: 'QuickFix HVAC',
            description: 'Certified technicians',
          },
          coverImageUrl: 'https://cdn.test/service-cover.jpg',
          createdAt: new Date('2026-04-20T10:00:00.000Z'),
          updatedAt: new Date('2026-04-21T10:00:00.000Z'),
        },
      ],
    });

    expect(repository.find.mock.calls[0]).toEqual([
      {
        where: {
          tenantId: 12,
          isActive: true,
        },
        relations: {
          category: true,
          provider: true,
          images: true,
        },
        order: {
          createdAt: 'DESC',
          images: {
            sortOrder: 'ASC',
          },
        },
      },
    ]);
  });

  it('rejects provider service creation when provider is not verified', async () => {
    providersRepository.findOne.mockResolvedValue(buildProvider(false));

    await expect(
      service.createProviderService(providerUser, {
        categoryId: 2,
        title: 'AC Repair',
        basePrice: 49.99,
      }),
    ).rejects.toThrow(
      'Provider verification is required before creating or publishing services.',
    );

    expect(categoriesRepository.exists.mock.calls).toHaveLength(0);
    expect(dataSource.transaction.mock.calls).toHaveLength(0);
  });

  it('rejects publishing a provider service when provider is not verified', async () => {
    providersRepository.findOne.mockResolvedValue(buildProvider(false));
    repository.findOne.mockResolvedValue({
      id: 5,
      tenantId: 12,
      providerId: 9,
      isActive: false,
      images: [],
    } as Service);

    await expect(
      service.updateProviderService(5, providerUser, {
        isActive: true,
      }),
    ).rejects.toThrow(
      'Provider verification is required before creating or publishing services.',
    );

    expect(categoriesRepository.exists.mock.calls).toHaveLength(0);
    expect(dataSource.transaction.mock.calls).toHaveLength(0);
  });
});

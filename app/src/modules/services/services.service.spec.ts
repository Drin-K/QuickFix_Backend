import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../shared/entities';
import { ServicesService } from './services.service';

describe('ServicesService', () => {
  let service: ServicesService;
  let repository: jest.Mocked<Repository<Service>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: getRepositoryToken(Service),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    repository = module.get(getRepositoryToken(Service));
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
});

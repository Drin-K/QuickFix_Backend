import { ForbiddenException } from '@nestjs/common';
import { User } from '../shared/entities';
import { AdminServicesService } from './admin-services.service';

type QueryBuilderMock = {
  leftJoinAndSelect: jest.Mock;
  orderBy: jest.Mock;
  addOrderBy: jest.Mock;
  andWhere: jest.Mock;
  getManyAndCount: jest.Mock;
};

type MockRepository = {
  createQueryBuilder: jest.Mock;
  findOne: jest.Mock;
};

const createQueryBuilderMock = (): QueryBuilderMock => {
  const queryBuilder = {
    leftJoinAndSelect: jest.fn(),
    orderBy: jest.fn(),
    addOrderBy: jest.fn(),
    andWhere: jest.fn(),
    getManyAndCount: jest.fn(),
  };

  queryBuilder.leftJoinAndSelect.mockReturnValue(queryBuilder);
  queryBuilder.orderBy.mockReturnValue(queryBuilder);
  queryBuilder.addOrderBy.mockReturnValue(queryBuilder);
  queryBuilder.andWhere.mockReturnValue(queryBuilder);

  return queryBuilder;
};

describe('AdminServicesService', () => {
  let service: AdminServicesService;
  let servicesRepository: MockRepository;
  let usersRepository: MockRepository;
  let queryBuilder: QueryBuilderMock;

  beforeEach(() => {
    queryBuilder = createQueryBuilderMock();
    servicesRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
    };
    usersRepository = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
    };

    service = new AdminServicesService(
      servicesRepository as never,
      usersRepository as never,
    );
  });

  it('returns services and applies search, provider, category, and status filters', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 1,
      isActive: true,
      role: { name: 'admin' },
    } as User);

    queryBuilder.getManyAndCount.mockResolvedValue([
      [
        {
          id: 12,
          tenantId: 3,
          title: 'Pipe Repair',
          description: 'Fix leaks and broken pipes',
          basePrice: '99.99',
          isActive: true,
          category: {
            id: 1,
            name: 'Plumbing',
          },
          provider: {
            id: 5,
            displayName: 'QuickFix Plumbing',
            isVerified: true,
          },
          images: [{ imageUrl: 'https://cdn.example.com/service-cover.jpg' }],
          createdAt: new Date('2026-04-20T08:00:00.000Z'),
          updatedAt: new Date('2026-04-21T08:00:00.000Z'),
        },
      ],
      1,
    ]);

    await expect(
      service.getServices(
        { id: 1, role: 'admin', tenantId: null },
        {
          search: ' Pipe ',
          providerId: 5,
          categoryId: 1,
          status: 'active',
        },
      ),
    ).resolves.toEqual({
      services: [
        {
          id: 12,
          tenantId: 3,
          title: 'Pipe Repair',
          description: 'Fix leaks and broken pipes',
          basePrice: '99.99',
          isActive: true,
          status: 'active',
          category: {
            id: 1,
            name: 'Plumbing',
          },
          provider: {
            id: 5,
            displayName: 'QuickFix Plumbing',
            isVerified: true,
          },
          coverImageUrl: 'https://cdn.example.com/service-cover.jpg',
          createdAt: new Date('2026-04-20T08:00:00.000Z'),
          updatedAt: new Date('2026-04-21T08:00:00.000Z'),
        },
      ],
      total: 1,
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      '(LOWER(service.title) LIKE :search OR LOWER(service.description) LIKE :search OR LOWER(provider.displayName) LIKE :search OR LOWER(category.name) LIKE :search)',
      { search: '%pipe%' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'service.providerId = :providerId',
      { providerId: 5 },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'service.categoryId = :categoryId',
      { categoryId: 1 },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'service.isActive = :isActive',
      { isActive: true },
    );
  });

  it('filters inactive services for platform admins', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 1,
      isActive: true,
      role: { name: 'platform_admin' },
    } as User);
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    await service.getServices(
      { id: 1, role: 'platform_admin', tenantId: null },
      { status: 'inactive' },
    );

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'service.isActive = :isActive',
      { isActive: false },
    );
  });

  it('rejects non-admin users', async () => {
    await expect(
      service.getServices({ id: 2, role: 'provider', tenantId: 7 }, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(servicesRepository.createQueryBuilder).not.toHaveBeenCalled();
  });
});

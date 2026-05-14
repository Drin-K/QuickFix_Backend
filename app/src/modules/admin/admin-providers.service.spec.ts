import { ForbiddenException } from '@nestjs/common';
import { User } from '../shared/entities';
import { AdminProvidersService } from './admin-providers.service';

type QueryBuilderMock = {
  leftJoinAndSelect: jest.Mock;
  loadRelationCountAndMap: jest.Mock;
  orderBy: jest.Mock;
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
    loadRelationCountAndMap: jest.fn(),
    orderBy: jest.fn(),
    andWhere: jest.fn(),
    getManyAndCount: jest.fn(),
  };

  queryBuilder.leftJoinAndSelect.mockReturnValue(queryBuilder);
  queryBuilder.loadRelationCountAndMap.mockReturnValue(queryBuilder);
  queryBuilder.orderBy.mockReturnValue(queryBuilder);
  queryBuilder.andWhere.mockReturnValue(queryBuilder);

  return queryBuilder;
};

describe('AdminProvidersService', () => {
  let service: AdminProvidersService;
  let providersRepository: MockRepository;
  let usersRepository: MockRepository;
  let queryBuilder: QueryBuilderMock;

  beforeEach(() => {
    queryBuilder = createQueryBuilderMock();
    providersRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
    };
    usersRepository = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
    };

    service = new AdminProvidersService(
      providersRepository as never,
      usersRepository as never,
    );
  });

  it('returns providers and applies search, status, and type filters', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 1,
      isActive: true,
      role: { name: 'admin' },
    } as User);

    queryBuilder.getManyAndCount.mockResolvedValue([
      [
        {
          id: 10,
          tenantId: 4,
          displayName: 'QuickFix Plumbing',
          type: 'company',
          isVerified: true,
          ownerUser: {
            fullName: 'Arta Admin',
            email: 'arta@example.com',
          },
          city: {
            name: 'Prishtina',
          },
          address: 'Main street 12',
          servicesCount: 5,
          documentsCount: 2,
          createdAt: new Date('2026-05-13T10:00:00.000Z'),
          updatedAt: new Date('2026-05-13T11:00:00.000Z'),
        },
      ],
      1,
    ]);

    await expect(
      service.getProviders(
        { id: 1, role: 'admin', tenantId: null },
        {
          search: ' QuickFix ',
          verificationStatus: 'verified',
          type: 'company',
        },
      ),
    ).resolves.toEqual({
      providers: [
        {
          id: 10,
          tenantId: 4,
          displayName: 'QuickFix Plumbing',
          type: 'company',
          verificationStatus: 'verified',
          isVerified: true,
          ownerName: 'Arta Admin',
          ownerEmail: 'arta@example.com',
          city: 'Prishtina',
          address: 'Main street 12',
          servicesCount: 5,
          documentsCount: 2,
          createdAt: new Date('2026-05-13T10:00:00.000Z'),
          updatedAt: new Date('2026-05-13T11:00:00.000Z'),
        },
      ],
      total: 1,
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      '(LOWER(provider.displayName) LIKE :search OR LOWER(ownerUser.fullName) LIKE :search)',
      { search: '%quickfix%' },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'provider.isVerified = :isVerified',
      { isVerified: true },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'provider.type = :type',
      { type: 'company' },
    );
  });

  it('filters unverified individual providers', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 1,
      isActive: true,
      role: { name: 'platform_admin' },
    } as User);
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    await service.getProviders(
      { id: 1, role: 'platform_admin', tenantId: null },
      {
        verificationStatus: 'unverified',
        type: 'individual',
      },
    );

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'provider.isVerified = :isVerified',
      { isVerified: false },
    );
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'provider.type = :type',
      { type: 'individual' },
    );
  });

  it('rejects non-admin users', async () => {
    await expect(
      service.getProviders({ id: 2, role: 'provider', tenantId: 7 }, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(providersRepository.createQueryBuilder).not.toHaveBeenCalled();
  });
});

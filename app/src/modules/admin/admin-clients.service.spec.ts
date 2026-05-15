import { ForbiddenException } from '@nestjs/common';
import { User } from '../shared/entities';
import { AdminClientsService } from './admin-clients.service';

type QueryBuilderMock = {
  leftJoinAndSelect: jest.Mock;
  loadRelationCountAndMap: jest.Mock;
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
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
    where: jest.fn(),
    andWhere: jest.fn(),
    orderBy: jest.fn(),
    getManyAndCount: jest.fn(),
  };

  queryBuilder.leftJoinAndSelect.mockReturnValue(queryBuilder);
  queryBuilder.loadRelationCountAndMap.mockReturnValue(queryBuilder);
  queryBuilder.where.mockReturnValue(queryBuilder);
  queryBuilder.andWhere.mockReturnValue(queryBuilder);
  queryBuilder.orderBy.mockReturnValue(queryBuilder);

  return queryBuilder;
};

describe('AdminClientsService', () => {
  let service: AdminClientsService;
  let usersRepository: MockRepository;
  let queryBuilder: QueryBuilderMock;

  beforeEach(() => {
    queryBuilder = createQueryBuilderMock();
    usersRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
    };

    service = new AdminClientsService(usersRepository as never);
  });

  it('returns clients with booking count and applies search', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 1,
      isActive: true,
      role: { name: 'admin' },
    } as User);
    queryBuilder.getManyAndCount.mockResolvedValue([
      [
        {
          id: 12,
          fullName: 'Arta Krasniqi',
          email: 'arta@example.com',
          phone: '+38344111000',
          bookingCount: 4,
          createdAt: new Date('2026-05-13T16:00:00.000Z'),
        },
      ],
      1,
    ]);

    await expect(
      service.getClients(
        { id: 1, role: 'admin', tenantId: null },
        { search: ' Arta ' },
      ),
    ).resolves.toEqual({
      clients: [
        {
          id: 12,
          fullName: 'Arta Krasniqi',
          email: 'arta@example.com',
          phone: '+38344111000',
          bookingCount: 4,
          createdAt: new Date('2026-05-13T16:00:00.000Z'),
        },
      ],
      total: 1,
    });

    expect(queryBuilder.where).toHaveBeenCalledWith('role.name = :roleName', {
      roleName: 'client',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      '(LOWER(user.fullName) LIKE :search OR LOWER(user.email) LIKE :search OR LOWER(user.phone) LIKE :search)',
      { search: '%arta%' },
    );
  });

  it('allows platform admins', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 1,
      isActive: true,
      role: { name: 'platform_admin' },
    } as User);
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    await expect(
      service.getClients({ id: 1, role: 'platform_admin', tenantId: null }, {}),
    ).resolves.toEqual({
      clients: [],
      total: 0,
    });
  });

  it('rejects non-admin users', async () => {
    await expect(
      service.getClients({ id: 2, role: 'client', tenantId: 7 }, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(usersRepository.createQueryBuilder).not.toHaveBeenCalled();
  });
});

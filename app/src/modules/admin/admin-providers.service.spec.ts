import { ForbiddenException } from '@nestjs/common';
import { Provider, User } from '../shared/entities';
import { AdminProvidersService } from './admin-providers.service';

type QueryBuilderMock = {
  leftJoinAndSelect: jest.Mock;
  loadRelationCountAndMap: jest.Mock;
  orderBy: jest.Mock;
  addOrderBy: jest.Mock;
  andWhere: jest.Mock;
  where: jest.Mock;
  getManyAndCount: jest.Mock;
  getMany: jest.Mock;
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
    addOrderBy: jest.fn(),
    andWhere: jest.fn(),
    where: jest.fn(),
    getManyAndCount: jest.fn(),
    getMany: jest.fn(),
  };

  queryBuilder.leftJoinAndSelect.mockReturnValue(queryBuilder);
  queryBuilder.loadRelationCountAndMap.mockReturnValue(queryBuilder);
  queryBuilder.orderBy.mockReturnValue(queryBuilder);
  queryBuilder.addOrderBy.mockReturnValue(queryBuilder);
  queryBuilder.andWhere.mockReturnValue(queryBuilder);
  queryBuilder.where.mockReturnValue(queryBuilder);

  return queryBuilder;
};

describe('AdminProvidersService', () => {
  let service: AdminProvidersService;
  let providersRepository: MockRepository;
  let servicesRepository: MockRepository;
  let usersRepository: MockRepository;
  let queryBuilder: QueryBuilderMock;

  beforeEach(() => {
    queryBuilder = createQueryBuilderMock();
    providersRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
    };
    servicesRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      findOne: jest.fn(),
    };
    usersRepository = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
    };

    service = new AdminProvidersService(
      providersRepository as never,
      servicesRepository as never,
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

  it('returns rich provider details for admins', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 1,
      isActive: true,
      role: { name: 'admin' },
    } as User);

    providersRepository.findOne.mockResolvedValue({
      id: 10,
      tenantId: 4,
      ownerUserId: 11,
      type: 'company',
      displayName: 'QuickFix Plumbing',
      description: 'Trusted plumbing help for households and offices.',
      city: {
        id: 3,
        name: 'Prishtina',
      },
      address: 'Main street 12',
      isVerified: true,
      averageRating: '4.90',
      createdAt: new Date('2026-04-15T09:00:00.000Z'),
      updatedAt: new Date('2026-05-13T16:00:00.000Z'),
      ownerUser: {
        id: 11,
        fullName: 'QuickFix Admin',
        email: 'quickfix@example.com',
        phone: '+38344111002',
        isActive: true,
        createdAt: new Date('2026-04-15T09:00:00.000Z'),
        updatedAt: new Date('2026-05-13T16:00:00.000Z'),
      },
      tenant: {
        id: 2,
        name: 'QuickFix Kosovo',
      },
      companyDetails: {
        id: 9,
        tenantId: 4,
        providerId: 10,
        businessName: 'QuickFix Plumbing LLC',
        businessNumber: 'BIZ-10293',
        website: 'https://quickfix.example.com',
        createdAt: new Date('2026-04-15T09:10:00.000Z'),
        updatedAt: new Date('2026-05-13T16:00:00.000Z'),
      },
      individualDetails: null,
      documents: [
        {
          id: 22,
          tenantId: 4,
          providerId: 10,
          documentType: 'tax_certificate',
          fileUrl: 'https://cdn.example.com/provider-documents/tax.pdf',
          isVerified: false,
          createdAt: new Date('2026-05-01T08:00:00.000Z'),
        },
        {
          id: 21,
          tenantId: 4,
          providerId: 10,
          documentType: 'business_license',
          fileUrl: 'https://cdn.example.com/provider-documents/license.pdf',
          isVerified: true,
          createdAt: new Date('2026-04-30T12:00:00.000Z'),
        },
      ],
    } as Provider);

    queryBuilder.getMany.mockResolvedValue([
      {
        id: 12,
        tenantId: 4,
        title: 'Pipe Repair',
        description: 'Fix leaks and broken pipes',
        basePrice: '99.99',
        isActive: true,
        createdAt: new Date('2026-04-20T08:00:00.000Z'),
        updatedAt: new Date('2026-04-21T08:00:00.000Z'),
        category: {
          id: 1,
          name: 'Plumbing',
        },
        images: [
          {
            id: 2,
            sortOrder: 2,
            imageUrl: 'https://cdn.example.com/service-12-2.jpg',
          },
          {
            id: 1,
            sortOrder: 1,
            imageUrl: 'https://cdn.example.com/service-12-1.jpg',
          },
        ],
      },
      {
        id: 13,
        tenantId: 4,
        title: 'Drain Cleaning',
        description: null,
        basePrice: '49.99',
        isActive: false,
        createdAt: new Date('2026-04-19T08:00:00.000Z'),
        updatedAt: new Date('2026-04-21T09:00:00.000Z'),
        category: null,
        images: [],
      },
    ]);

    await expect(
      service.getProviderDetails(
        { id: 1, role: 'admin', tenantId: null },
        10,
      ),
    ).resolves.toMatchObject({
      provider: {
        id: 10,
        tenantId: 4,
        ownerUserId: 11,
        displayName: 'QuickFix Plumbing',
        type: 'company',
        description: 'Trusted plumbing help for households and offices.',
        city: {
          id: 3,
          name: 'Prishtina',
        },
        address: 'Main street 12',
        isVerified: true,
        verificationStatus: 'verified',
        averageRating: '4.90',
        servicesCount: 2,
        documentsCount: 2,
        owner: {
          id: 11,
          fullName: 'QuickFix Admin',
          email: 'quickfix@example.com',
          phone: '+38344111002',
          isActive: true,
          createdAt: new Date('2026-04-15T09:00:00.000Z'),
          updatedAt: new Date('2026-05-13T16:00:00.000Z'),
        },
        tenant: {
          id: 2,
          name: 'QuickFix Kosovo',
        },
        createdAt: new Date('2026-04-15T09:00:00.000Z'),
        updatedAt: new Date('2026-05-13T16:00:00.000Z'),
      },
      details: {
        type: 'company',
        companyDetails: {
          id: 9,
          tenantId: 4,
          providerId: 10,
          businessName: 'QuickFix Plumbing LLC',
          businessNumber: 'BIZ-10293',
          website: 'https://quickfix.example.com',
          createdAt: new Date('2026-04-15T09:10:00.000Z'),
          updatedAt: new Date('2026-05-13T16:00:00.000Z'),
        },
        individualDetails: null,
      },
      documents: [
        {
          id: 22,
          tenantId: 4,
          providerId: 10,
          documentType: 'tax_certificate',
          fileUrl: 'https://cdn.example.com/provider-documents/tax.pdf',
          isVerified: false,
          status: 'pending',
          createdAt: new Date('2026-05-01T08:00:00.000Z'),
        },
        {
          id: 21,
          tenantId: 4,
          providerId: 10,
          documentType: 'business_license',
          fileUrl: 'https://cdn.example.com/provider-documents/license.pdf',
          isVerified: true,
          status: 'verified',
          createdAt: new Date('2026-04-30T12:00:00.000Z'),
        },
      ],
      servicesSummary: {
        totalCount: 2,
        activeCount: 1,
        inactiveCount: 1,
        recentServices: [
          {
            id: 12,
            tenantId: 4,
            title: 'Pipe Repair',
            description: 'Fix leaks and broken pipes',
            basePrice: '99.99',
            isActive: true,
            status: 'active',
            category: {
              id: 1,
              name: 'Plumbing',
            },
            coverImageUrl: 'https://cdn.example.com/service-12-1.jpg',
            createdAt: new Date('2026-04-20T08:00:00.000Z'),
            updatedAt: new Date('2026-04-21T08:00:00.000Z'),
          },
          {
            id: 13,
            tenantId: 4,
            title: 'Drain Cleaning',
            description: null,
            basePrice: '49.99',
            isActive: false,
            status: 'inactive',
            category: null,
            coverImageUrl: null,
            createdAt: new Date('2026-04-19T08:00:00.000Z'),
            updatedAt: new Date('2026-04-21T09:00:00.000Z'),
          },
        ],
      },
      verificationInfo: {
        isVerified: true,
        status: 'verified',
        totalDocuments: 2,
        verifiedDocuments: 1,
        pendingDocuments: 1,
      },
    });

    expect(providersRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 10,
      },
      relations: {
        ownerUser: true,
        tenant: true,
        city: true,
        companyDetails: true,
        individualDetails: true,
        documents: true,
      },
    });

    expect(queryBuilder.where).toHaveBeenCalledWith('service.providerId = :providerId', {
      providerId: 10,
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('service.tenantId = :tenantId', {
      tenantId: 4,
    });
  });

  it('falls back to tenant or owner identifiers when the direct provider id is not found', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 1,
      isActive: true,
      role: { name: 'admin' },
    } as User);

    providersRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 10,
        tenantId: 4,
        ownerUserId: 11,
        type: 'company',
        displayName: 'QuickFix Plumbing',
        description: 'Trusted plumbing help for households and offices.',
        city: {
          id: 3,
          name: 'Prishtina',
        },
        address: 'Main street 12',
        isVerified: true,
        averageRating: '4.90',
        createdAt: new Date('2026-04-15T09:00:00.000Z'),
        updatedAt: new Date('2026-05-13T16:00:00.000Z'),
        ownerUser: {
          id: 11,
          fullName: 'QuickFix Admin',
          email: 'quickfix@example.com',
          phone: '+38344111002',
          isActive: true,
          createdAt: new Date('2026-04-15T09:00:00.000Z'),
          updatedAt: new Date('2026-05-13T16:00:00.000Z'),
        },
        tenant: {
          id: 2,
          name: 'QuickFix Kosovo',
        },
        companyDetails: null,
        individualDetails: null,
        documents: [],
      } as Provider);

    queryBuilder.getMany.mockResolvedValue([]);

    await expect(
      service.getProviderDetails(
        { id: 1, role: 'admin', tenantId: null },
        4,
      ),
    ).resolves.toMatchObject({
      provider: {
        id: 10,
        tenantId: 4,
        ownerUserId: 11,
        displayName: 'QuickFix Plumbing',
      },
    });

    expect(providersRepository.findOne).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { id: 4 },
      }),
    );
    expect(providersRepository.findOne).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { tenantId: 4 },
      }),
    );
  });
});

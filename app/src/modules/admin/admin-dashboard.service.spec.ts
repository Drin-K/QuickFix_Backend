import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Booking,
  Provider,
  ProviderDocument,
  Service,
  User,
} from '../shared/entities';
import { AdminDashboardService } from './admin-dashboard.service';

type MockRepository = {
  count: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
};

const createRepositoryMock = (): MockRepository => ({
  count: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;
  let providersRepository: MockRepository;
  let providerDocumentsRepository: MockRepository;
  let servicesRepository: MockRepository;
  let usersRepository: MockRepository;
  let bookingsRepository: MockRepository;

  beforeEach(async () => {
    providersRepository = createRepositoryMock();
    providerDocumentsRepository = createRepositoryMock();
    servicesRepository = createRepositoryMock();
    usersRepository = createRepositoryMock();
    bookingsRepository = createRepositoryMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminDashboardService,
        {
          provide: getRepositoryToken(Provider),
          useValue: providersRepository,
        },
        {
          provide: getRepositoryToken(ProviderDocument),
          useValue: providerDocumentsRepository,
        },
        {
          provide: getRepositoryToken(Service),
          useValue: servicesRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: bookingsRepository,
        },
      ],
    }).compile();

    service = module.get(AdminDashboardService);
  });

  it('returns system-wide dashboard stats for admins', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 1,
      isActive: true,
      role: { name: 'admin' },
    });

    providersRepository.count
      .mockResolvedValueOnce(6)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(4);
    providerDocumentsRepository.count.mockResolvedValue(3);
    servicesRepository.count.mockResolvedValue(12);
    usersRepository.count.mockResolvedValue(8);

    providersRepository.find.mockResolvedValue([
      {
        id: 7,
        type: 'individual',
        displayName: 'Arta Fix',
        isVerified: false,
        createdAt: new Date('2026-05-13T10:00:00.000Z'),
        ownerUser: { fullName: 'Arta Fix' },
      },
    ]);
    providerDocumentsRepository.find.mockResolvedValue([]);
    servicesRepository.find.mockResolvedValue([]);
    bookingsRepository.find.mockResolvedValue([]);

    await expect(
      service.getStats({ id: 1, role: 'admin', tenantId: null }),
    ).resolves.toEqual({
      totalProviders: 6,
      pendingProviders: 2,
      verifiedProviders: 4,
      pendingDocuments: 3,
      activeServices: 12,
      clientsCount: 8,
      recentActivity: [
        {
          id: 'provider-7',
          type: 'provider',
          title: 'Provider awaiting verification',
          description: 'Arta Fix registered as a individual provider.',
          occurredAt: '2026-05-13T10:00:00.000Z',
          status: 'pending',
          actor: 'Arta Fix',
        },
      ],
    });
  });

  it('rejects non-admin users', async () => {
    await expect(
      service.getStats({ id: 2, role: 'provider', tenantId: 5 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

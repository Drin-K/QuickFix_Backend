import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminProvidersController } from './admin-providers.controller';
import { AdminProvidersService } from './admin-providers.service';

describe('AdminProvidersController', () => {
  let controller: AdminProvidersController;
  let adminProvidersService: {
    getProviders: jest.Mock;
    getProviderDetails: jest.Mock;
  };

  beforeEach(async () => {
    adminProvidersService = {
      getProviders: jest.fn(),
      getProviderDetails: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminProvidersController],
      providers: [
        {
          provide: AdminProvidersService,
          useValue: adminProvidersService,
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

    controller = module.get<AdminProvidersController>(AdminProvidersController);
  });

  it('returns provider list for admins', async () => {
    const user = { id: 1, role: 'admin', tenantId: null } as const;
    const query = {
      search: 'QuickFix',
      verificationStatus: 'verified',
      type: 'company',
    } as const;

    adminProvidersService.getProviders.mockResolvedValue({
      providers: [],
      total: 0,
    });

    await expect(controller.getProviders(user, query as never)).resolves.toEqual({
      providers: [],
      total: 0,
    });

    expect(adminProvidersService.getProviders).toHaveBeenCalledWith(user, query);
  });

  it('returns provider details for admins', async () => {
    const user = { id: 1, role: 'admin', tenantId: null } as const;
    adminProvidersService.getProviderDetails.mockResolvedValue({
      provider: { id: 10 },
      details: { type: 'company' },
      documents: [],
      servicesSummary: {
        totalCount: 0,
        activeCount: 0,
        inactiveCount: 0,
        recentServices: [],
      },
      verificationInfo: {
        isVerified: false,
        status: 'unverified',
        totalDocuments: 0,
        verifiedDocuments: 0,
        pendingDocuments: 0,
      },
    });

    await expect(controller.getProviderDetails(user, 10)).resolves.toEqual({
      provider: { id: 10 },
      details: { type: 'company' },
      documents: [],
      servicesSummary: {
        totalCount: 0,
        activeCount: 0,
        inactiveCount: 0,
        recentServices: [],
      },
      verificationInfo: {
        isVerified: false,
        status: 'unverified',
        totalDocuments: 0,
        verifiedDocuments: 0,
        pendingDocuments: 0,
      },
    });

    expect(adminProvidersService.getProviderDetails).toHaveBeenCalledWith(user, 10);
  });
});

import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminProviderDocumentsController } from './admin-provider-documents.controller';
import { AdminProvidersService } from './admin-providers.service';

describe('AdminProviderDocumentsController', () => {
  let controller: AdminProviderDocumentsController;
  let adminProvidersService: {
    verifyProviderDocument: jest.Mock;
    unverifyProviderDocument: jest.Mock;
  };

  beforeEach(async () => {
    adminProvidersService = {
      verifyProviderDocument: jest.fn(),
      unverifyProviderDocument: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminProviderDocumentsController],
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

    controller = module.get<AdminProviderDocumentsController>(
      AdminProviderDocumentsController,
    );
  });

  it('verifies provider documents for admins', async () => {
    const user = { id: 1, role: 'admin', tenantId: null } as const;
    adminProvidersService.verifyProviderDocument.mockResolvedValue({
      message: 'Document verified successfully.',
      provider: { id: 10, isVerified: false },
    });

    await expect(controller.verifyProviderDocument(user, 22)).resolves.toEqual({
      message: 'Document verified successfully.',
      provider: { id: 10, isVerified: false },
    });

    expect(adminProvidersService.verifyProviderDocument).toHaveBeenCalledWith(
      user,
      22,
    );
  });

  it('unverifies provider documents for admins', async () => {
    const user = { id: 1, role: 'admin', tenantId: null } as const;
    adminProvidersService.unverifyProviderDocument.mockResolvedValue({
      message: 'Document unverified successfully.',
      provider: { id: 10, isVerified: true },
    });

    await expect(
      controller.unverifyProviderDocument(user, 22),
    ).resolves.toEqual({
      message: 'Document unverified successfully.',
      provider: { id: 10, isVerified: true },
    });

    expect(adminProvidersService.unverifyProviderDocument).toHaveBeenCalledWith(
      user,
      22,
    );
  });
});

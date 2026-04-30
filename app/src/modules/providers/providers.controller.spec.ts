import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProvidersController } from './providers.controller';
import { ProvidersService } from './providers.service';

describe('ProvidersController', () => {
  let controller: ProvidersController;
  let providersService: {
    setupProvider: jest.Mock;
    getVerificationStatus: jest.Mock;
  };

  beforeEach(async () => {
    providersService = {
      setupProvider: jest.fn(),
      getVerificationStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProvidersController],
      providers: [
        {
          provide: ProvidersService,
          useValue: providersService,
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

    controller = module.get<ProvidersController>(ProvidersController);
  });

  it('returns verification status for the authenticated provider', async () => {
    const user = { id: 3, role: 'provider', tenantId: 5 } as const;
    const response = {
      providerId: 9,
      tenantId: 5,
      isVerified: false,
      status: 'pending',
    };

    providersService.getVerificationStatus.mockResolvedValue(response);

    await expect(controller.getVerificationStatus(user)).resolves.toEqual(
      response,
    );
    expect(providersService.getVerificationStatus).toHaveBeenCalledWith(user);
  });
});

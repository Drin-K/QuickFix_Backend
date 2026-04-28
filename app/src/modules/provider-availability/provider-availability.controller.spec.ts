import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProviderAvailabilityController } from './provider-availability.controller';
import { ProviderAvailabilityService } from './provider-availability.service';

describe('ProviderAvailabilityController', () => {
  let controller: ProviderAvailabilityController;
  let providerAvailabilityService: {
    getMyAvailability: jest.Mock;
    createAvailability: jest.Mock;
    deleteAvailability: jest.Mock;
  };

  beforeEach(async () => {
    providerAvailabilityService = {
      getMyAvailability: jest.fn(),
      createAvailability: jest.fn(),
      deleteAvailability: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProviderAvailabilityController],
      providers: [
        {
          provide: ProviderAvailabilityService,
          useValue: providerAvailabilityService,
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

    controller = module.get<ProviderAvailabilityController>(
      ProviderAvailabilityController,
    );
  });

  it('returns the authenticated provider slots', async () => {
    const user = { id: 3, role: 'provider', tenantId: 5 } as const;
    providerAvailabilityService.getMyAvailability.mockResolvedValue([]);

    await expect(controller.getMyAvailability(user)).resolves.toEqual([]);
    expect(providerAvailabilityService.getMyAvailability).toHaveBeenCalledWith(
      user,
    );
  });

  it('creates a slot for the authenticated provider', async () => {
    const user = { id: 3, role: 'provider', tenantId: 5 } as const;
    const dto = {
      startTime: '2026-05-01T09:00:00.000Z',
      endTime: '2026-05-01T10:00:00.000Z',
    };
    providerAvailabilityService.createAvailability.mockResolvedValue({
      id: 1,
    });

    await expect(controller.createAvailability(dto, user)).resolves.toEqual({
      id: 1,
    });
    expect(providerAvailabilityService.createAvailability).toHaveBeenCalledWith(
      dto,
      user,
    );
  });

  it('deletes a slot for the authenticated provider', async () => {
    const user = { id: 3, role: 'provider', tenantId: 5 } as const;
    providerAvailabilityService.deleteAvailability.mockResolvedValue(undefined);

    await expect(controller.deleteAvailability(7, user)).resolves.toBe(
      undefined,
    );
    expect(providerAvailabilityService.deleteAvailability).toHaveBeenCalledWith(
      7,
      user,
    );
  });
});

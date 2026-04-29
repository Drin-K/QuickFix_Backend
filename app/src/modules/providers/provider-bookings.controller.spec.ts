import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProviderBookingsController } from './provider-bookings.controller';
import { ProvidersService } from './providers.service';

describe('ProviderBookingsController', () => {
  let controller: ProviderBookingsController;
  let providersService: {
    getProviderBookings: jest.Mock;
    updateProviderBookingStatus: jest.Mock;
  };

  beforeEach(async () => {
    providersService = {
      getProviderBookings: jest.fn(),
      updateProviderBookingStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProviderBookingsController],
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

    controller = module.get<ProviderBookingsController>(
      ProviderBookingsController,
    );
  });

  it('returns the authenticated provider bookings', async () => {
    const user = { id: 3, role: 'provider', tenantId: 5 } as const;
    providersService.getProviderBookings.mockResolvedValue([]);

    await expect(controller.getProviderBookings(user)).resolves.toEqual([]);
    expect(providersService.getProviderBookings).toHaveBeenCalledWith(user);
  });

  it('updates the status for an authenticated provider booking', async () => {
    const user = { id: 3, role: 'provider', tenantId: 5 } as const;
    const dto = { status: 'confirmed' };
    providersService.updateProviderBookingStatus.mockResolvedValue({ id: 11 });

    await expect(
      controller.updateBookingStatus(11, dto, user),
    ).resolves.toEqual({ id: 11 });
    expect(providersService.updateProviderBookingStatus).toHaveBeenCalledWith(
      11,
      dto,
      user,
    );
  });
});

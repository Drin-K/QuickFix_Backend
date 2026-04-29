import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  Booking,
  BookingStatus,
  Provider,
  ProviderCompanyDetail,
  ProviderIndividualDetail,
} from '../shared/entities';
import { ProvidersService } from './providers.service';

describe('ProvidersService', () => {
  let service: ProvidersService;
  let bookingsRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let bookingStatusesRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let providersRepository: {
    findOne: jest.Mock;
  };
  let dataSource: {
    transaction: jest.Mock;
  };

  beforeEach(async () => {
    bookingsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    bookingStatusesRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    providersRepository = {
      findOne: jest.fn(),
    };

    dataSource = {
      transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProvidersService,
        {
          provide: getRepositoryToken(Booking),
          useValue: bookingsRepository,
        },
        {
          provide: getRepositoryToken(BookingStatus),
          useValue: bookingStatusesRepository,
        },
        {
          provide: getRepositoryToken(Provider),
          useValue: providersRepository,
        },
        {
          provide: getRepositoryToken(ProviderIndividualDetail),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(ProviderCompanyDetail),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<ProvidersService>(ProvidersService);
  });

  it('returns only bookings for the authenticated provider', async () => {
    const user = { id: 7, role: 'provider', tenantId: 4 } as const;
    providersRepository.findOne.mockResolvedValue({ id: 22, tenantId: 4 });
    bookingsRepository.find.mockResolvedValue([
      {
        id: 9,
        tenantId: 4,
        providerId: 22,
        bookingDate: new Date('2026-05-10T14:00:00.000Z'),
        totalPrice: '99.99',
        notes: 'Bring tools',
        createdAt: new Date('2026-04-23T16:45:00.000Z'),
        updatedAt: new Date('2026-04-23T16:45:00.000Z'),
        status: { id: 1, name: 'pending' },
        service: { id: 12, title: 'Pipe Repair', basePrice: '99.99' },
        provider: { id: 22, displayName: 'QuickFix Plumbing' },
        clientUser: {
          id: 31,
          fullName: 'Jane Client',
          email: 'jane@example.com',
        },
      },
    ]);

    await expect(service.getProviderBookings(user)).resolves.toEqual([
      expect.objectContaining({
        id: 9,
        client: {
          id: 31,
          fullName: 'Jane Client',
          email: 'jane@example.com',
        },
      }),
    ]);

    expect(bookingsRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 4,
          providerId: 22,
        },
      }),
    );
  });

  it('rejects provider bookings access for non-provider users', async () => {
    const user = { id: 7, role: 'client', tenantId: 4 } as const;

    await expect(service.getProviderBookings(user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('updates a provider booking status and records history', async () => {
    const user = { id: 7, role: 'provider', tenantId: 4 } as const;
    const booking = {
      id: 14,
      tenantId: 4,
      providerId: 22,
      statusId: 1,
      bookingDate: new Date('2026-05-10T14:00:00.000Z'),
      totalPrice: '99.99',
      notes: 'Bring tools',
      createdAt: new Date('2026-04-23T16:45:00.000Z'),
      updatedAt: new Date('2026-04-23T16:45:00.000Z'),
      status: { id: 1, name: 'pending' },
      service: { id: 12, title: 'Pipe Repair', basePrice: '99.99' },
      provider: { id: 22, displayName: 'QuickFix Plumbing' },
      clientUser: {
        id: 31,
        fullName: 'Jane Client',
        email: 'jane@example.com',
      },
    };
    const nextStatus = { id: 2, name: 'confirmed' };
    const saveBooking = jest.fn();
    const createHistoryEntry = jest
      .fn()
      .mockImplementation((value: unknown) => value);
    const saveHistoryEntry = jest.fn();
    const findOneOrFail = jest.fn().mockResolvedValue({
      ...booking,
      statusId: 2,
      status: nextStatus,
      updatedAt: new Date('2026-04-24T09:00:00.000Z'),
    });

    providersRepository.findOne.mockResolvedValue({ id: 22, tenantId: 4 });
    bookingsRepository.findOne.mockResolvedValue(booking);
    bookingStatusesRepository.findOne.mockResolvedValue(nextStatus);
    dataSource.transaction.mockImplementation(async (callback: any) =>
      callback({
        getRepository: (entity: unknown) => {
          if (entity === Booking) {
            return {
              save: saveBooking,
              findOneOrFail,
            };
          }

          return {
            create: createHistoryEntry,
            save: saveHistoryEntry,
          };
        },
      }),
    );

    await expect(
      service.updateProviderBookingStatus(14, { status: 'Confirmed' }, user),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 14,
        status: { id: 2, name: 'confirmed' },
      }),
    );

    expect(saveBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 14,
        statusId: 2,
      }),
    );
    expect(createHistoryEntry).toHaveBeenCalledWith({
      tenantId: 4,
      bookingId: 14,
      oldStatusId: 1,
      newStatusId: 2,
    });
    expect(saveHistoryEntry).toHaveBeenCalled();
  });

  it('rejects empty booking statuses', async () => {
    const user = { id: 7, role: 'provider', tenantId: 4 } as const;
    providersRepository.findOne.mockResolvedValue({ id: 22, tenantId: 4 });

    await expect(
      service.updateProviderBookingStatus(14, { status: '   ' }, user),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not update another provider booking', async () => {
    const user = { id: 7, role: 'provider', tenantId: 4 } as const;
    providersRepository.findOne.mockResolvedValue({ id: 22, tenantId: 4 });
    bookingsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.updateProviderBookingStatus(99, { status: 'confirmed' }, user),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects missing tenant context for provider actions', async () => {
    const user = { id: 7, role: 'provider', tenantId: null } as const;

    await expect(
      service.updateProviderBookingStatus(14, { status: 'confirmed' }, user),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

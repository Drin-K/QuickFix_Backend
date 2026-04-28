import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AvailabilitySlot, Provider } from '../shared/entities';
import type { RequestUser } from '../auth/jwt-auth.guard';
import { ProviderAvailabilityService } from './provider-availability.service';

describe('ProviderAvailabilityService', () => {
  let service: ProviderAvailabilityService;
  let availabilitySlotsRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let providersRepository: {
    findOne: jest.Mock;
  };
  let queryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    getOne: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    availabilitySlotsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };

    providersRepository = {
      findOne: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProviderAvailabilityService,
        {
          provide: getRepositoryToken(AvailabilitySlot),
          useValue: availabilitySlotsRepository,
        },
        {
          provide: getRepositoryToken(Provider),
          useValue: providersRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(ProviderAvailabilityService);
  });

  it('returns only current provider slots', async () => {
    const requestUser: RequestUser = { id: 11, role: 'provider', tenantId: 8 };
    providersRepository.findOne.mockResolvedValue({
      id: 4,
      tenantId: 8,
    });
    availabilitySlotsRepository.find.mockResolvedValue([
      {
        id: 2,
        tenantId: 8,
        providerId: 4,
        startTime: new Date('2026-05-01T09:00:00.000Z'),
        endTime: new Date('2026-05-01T10:00:00.000Z'),
        isBooked: false,
        createdAt: new Date('2026-04-28T10:00:00.000Z'),
        updatedAt: new Date('2026-04-28T10:00:00.000Z'),
      },
    ]);

    await expect(service.getMyAvailability(requestUser)).resolves.toEqual([
      {
        id: 2,
        tenantId: 8,
        providerId: 4,
        startTime: new Date('2026-05-01T09:00:00.000Z'),
        endTime: new Date('2026-05-01T10:00:00.000Z'),
        isBooked: false,
        createdAt: new Date('2026-04-28T10:00:00.000Z'),
        updatedAt: new Date('2026-04-28T10:00:00.000Z'),
      },
    ]);

    expect(availabilitySlotsRepository.find).toHaveBeenCalledWith({
      where: {
        tenantId: 8,
        providerId: 4,
      },
      order: {
        startTime: 'ASC',
        createdAt: 'ASC',
      },
    });
  });

  it('creates a new slot for the authenticated provider', async () => {
    const requestUser: RequestUser = { id: 11, role: 'provider', tenantId: 8 };
    providersRepository.findOne.mockResolvedValue({
      id: 4,
      tenantId: 8,
    });
    queryBuilder.getOne.mockResolvedValue(null);
    availabilitySlotsRepository.create.mockImplementation(
      (value: Partial<AvailabilitySlot>) => value,
    );
    availabilitySlotsRepository.save.mockImplementation(
      (value: Partial<AvailabilitySlot>) =>
        Promise.resolve({
          id: 20,
          createdAt: new Date('2026-04-28T11:00:00.000Z'),
          updatedAt: new Date('2026-04-28T11:00:00.000Z'),
          ...value,
        }),
    );

    const response = await service.createAvailability(
      {
        startTime: '2026-05-01T12:00:00.000Z',
        endTime: '2026-05-01T13:00:00.000Z',
      },
      requestUser,
    );

    expect(response).toMatchObject({
      id: 20,
      tenantId: 8,
      providerId: 4,
      isBooked: false,
    });
    expect(availabilitySlotsRepository.create).toHaveBeenCalledWith({
      tenantId: 8,
      providerId: 4,
      startTime: new Date('2026-05-01T12:00:00.000Z'),
      endTime: new Date('2026-05-01T13:00:00.000Z'),
      isBooked: false,
    });
  });

  it('prevents overlapping slots', async () => {
    const requestUser: RequestUser = { id: 11, role: 'provider', tenantId: 8 };
    providersRepository.findOne.mockResolvedValue({
      id: 4,
      tenantId: 8,
    });
    queryBuilder.getOne.mockResolvedValue({ id: 99 });

    await expect(
      service.createAvailability(
        {
          startTime: '2026-05-01T12:00:00.000Z',
          endTime: '2026-05-01T13:00:00.000Z',
        },
        requestUser,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('refuses invalid slot ranges', async () => {
    const requestUser: RequestUser = { id: 11, role: 'provider', tenantId: 8 };
    providersRepository.findOne.mockResolvedValue({
      id: 4,
      tenantId: 8,
    });

    await expect(
      service.createAvailability(
        {
          startTime: '2026-05-01T13:00:00.000Z',
          endTime: '2026-05-01T12:00:00.000Z',
        },
        requestUser,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deletes provider owned unbooked slots', async () => {
    const requestUser: RequestUser = { id: 11, role: 'provider', tenantId: 8 };
    providersRepository.findOne.mockResolvedValue({
      id: 4,
      tenantId: 8,
    });
    availabilitySlotsRepository.findOne.mockResolvedValue({
      id: 2,
      tenantId: 8,
      providerId: 4,
      isBooked: false,
    });

    await expect(service.deleteAvailability(2, requestUser)).resolves.toBe(
      undefined,
    );
    expect(availabilitySlotsRepository.remove).toHaveBeenCalledWith({
      id: 2,
      tenantId: 8,
      providerId: 4,
      isBooked: false,
    });
  });

  it('does not delete booked slots', async () => {
    const requestUser: RequestUser = { id: 11, role: 'provider', tenantId: 8 };
    providersRepository.findOne.mockResolvedValue({
      id: 4,
      tenantId: 8,
    });
    availabilitySlotsRepository.findOne.mockResolvedValue({
      id: 2,
      tenantId: 8,
      providerId: 4,
      isBooked: true,
    });

    await expect(
      service.deleteAvailability(2, requestUser),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when slot does not belong to current provider', async () => {
    const requestUser: RequestUser = { id: 11, role: 'provider', tenantId: 8 };
    providersRepository.findOne.mockResolvedValue({
      id: 4,
      tenantId: 8,
    });
    availabilitySlotsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.deleteAvailability(99, requestUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects non-provider users', async () => {
    const requestUser: RequestUser = { id: 11, role: 'client', tenantId: null };

    await expect(service.getMyAvailability(requestUser)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects provider users without a valid provider record', async () => {
    const requestUser: RequestUser = { id: 11, role: 'provider', tenantId: 8 };
    providersRepository.findOne.mockResolvedValue(null);

    await expect(service.getMyAvailability(requestUser)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

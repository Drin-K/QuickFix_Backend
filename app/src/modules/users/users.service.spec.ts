import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from '../shared/entities';
import type { RequestUser } from '../auth/jwt-auth.guard';

describe('UsersService', () => {
  let usersService: UsersService;
  let usersRepository: jest.Mocked<Pick<Repository<User>, 'findOne'>>;

  beforeEach(async () => {
    usersRepository = {
      findOne: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepository,
        },
      ],
    }).compile();

    usersService = moduleRef.get(UsersService);
  });

  it('throws when user context is missing', async () => {
    await expect(usersService.getMe(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('throws when user does not exist', async () => {
    usersRepository.findOne.mockResolvedValueOnce(null);
    const requestUser: RequestUser = { id: 123, role: 'client', tenantId: null };

    await expect(usersService.getMe(requestUser)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns provider user with tenant + provider profile', async () => {
    usersRepository.findOne.mockResolvedValueOnce({
      id: 1,
      email: 'provider@example.com',
      fullName: 'Provider One',
      phone: null,
      role: { id: 2, name: 'provider', users: [] },
      provider: {
        id: 10,
        tenantId: 99,
        ownerUserId: 1,
        type: 'individual',
        displayName: 'Provider One',
        description: null,
        cityId: null,
        address: null,
        isVerified: false,
        averageRating: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        tenant: { id: 99, name: 'tenant-foo', createdAt: new Date() },
      },
    } as unknown as User);

    const requestUser: RequestUser = { id: 1, role: 'provider', tenantId: 99 };
    const response = await usersService.getMe(requestUser);

    expect(response.role).toBe('provider');
    expect(response.tenantId).toBe(99);
    expect(response.tenant).toEqual({ id: 99, name: 'tenant-foo' });
    expect(response.provider?.id).toBe(10);
  });

  it('returns client user without tenant/provider', async () => {
    usersRepository.findOne.mockResolvedValueOnce({
      id: 2,
      email: 'client@example.com',
      fullName: 'Client One',
      phone: '123',
      role: { id: 1, name: 'client', users: [] },
      provider: null,
    } as unknown as User);

    const requestUser: RequestUser = { id: 2, role: 'client', tenantId: null };
    const response = await usersService.getMe(requestUser);

    expect(response.role).toBe('client');
    expect(response.tenantId).toBeNull();
    expect(response.tenant).toBeNull();
    expect(response.provider).toBeNull();
  });

  it('throws when token role mismatches database role', async () => {
    usersRepository.findOne.mockResolvedValueOnce({
      id: 3,
      email: 'x@example.com',
      fullName: 'X',
      phone: null,
      role: { id: 1, name: 'client', users: [] },
      provider: null,
    } as unknown as User);

    const requestUser: RequestUser = { id: 3, role: 'provider', tenantId: 1 };
    await expect(usersService.getMe(requestUser)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});


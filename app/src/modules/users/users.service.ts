import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthRole, RequestUser } from '../auth/jwt-auth.guard';
import { User } from '../shared/entities';

export type MeResponse = {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  role: AuthRole;
  tenantId: number | null;
  tenant: { id: number; name: string } | null;
  provider: {
    id: number;
    type: 'company' | 'individual';
    displayName: string;
    description: string | null;
    cityId: number | null;
    address: string | null;
    isVerified: boolean;
    averageRating: string | null;
  } | null;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async getMe(user: RequestUser | undefined): Promise<MeResponse> {
    if (!user) {
      throw new UnauthorizedException('Authentication token is required');
    }

    const currentUser = await this.usersRepository.findOne({
      where: { id: user.id },
      relations: {
        role: true,
        provider: {
          tenant: true,
        },
      },
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    const role = currentUser.role?.name as AuthRole | undefined;

    if (!role || role !== user.role) {
      throw new UnauthorizedException('Invalid authentication context');
    }

    const provider = currentUser.provider;
    const tenantId = user.tenantId ?? null;

    if (role === 'provider') {
      if (!provider || !tenantId || provider.tenantId !== tenantId) {
        throw new UnauthorizedException('Invalid tenant context');
      }
    } else if (tenantId) {
      throw new UnauthorizedException('Invalid tenant context');
    }

    return {
      id: currentUser.id,
      email: currentUser.email,
      fullName: currentUser.fullName,
      phone: currentUser.phone,
      role,
      tenantId,
      tenant:
        role === 'provider' && provider?.tenant
          ? { id: provider.tenant.id, name: provider.tenant.name }
          : null,
      provider:
        role === 'provider' && provider
          ? {
              id: provider.id,
              type: provider.type,
              displayName: provider.displayName,
              description: provider.description,
              cityId: provider.cityId,
              address: provider.address,
              isVerified: provider.isVerified,
              averageRating: provider.averageRating,
            }
          : null,
    };
  }
}


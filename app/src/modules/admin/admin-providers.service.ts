import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestUser } from '../auth/jwt-auth.guard';
import { Provider, User } from '../shared/entities';
import { AdminProvidersQueryDto } from './dto/admin-providers-query.dto';

type ProviderWithCounts = Provider & {
  servicesCount?: number;
  documentsCount?: number;
};

export type AdminProviderListItem = {
  id: number;
  tenantId: number;
  displayName: string;
  type: 'company' | 'individual';
  verificationStatus: 'verified' | 'unverified';
  isVerified: boolean;
  ownerName: string | null;
  ownerEmail: string | null;
  city: string | null;
  address: string | null;
  servicesCount: number;
  documentsCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminProvidersResponse = {
  providers: AdminProviderListItem[];
  total: number;
};

@Injectable()
export class AdminProvidersService {
  constructor(
    @InjectRepository(Provider)
    private readonly providersRepository: Repository<Provider>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async getProviders(
    user: RequestUser,
    query: AdminProvidersQueryDto,
  ): Promise<AdminProvidersResponse> {
    await this.assertAdminUser(user);

    const queryBuilder = this.providersRepository
      .createQueryBuilder('provider')
      .leftJoinAndSelect('provider.ownerUser', 'ownerUser')
      .leftJoinAndSelect('provider.city', 'city')
      .loadRelationCountAndMap('provider.servicesCount', 'provider.services')
      .loadRelationCountAndMap('provider.documentsCount', 'provider.documents')
      .orderBy('provider.createdAt', 'DESC');

    const search = query.search?.trim().toLowerCase();

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(provider.displayName) LIKE :search OR LOWER(ownerUser.fullName) LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (query.verificationStatus) {
      queryBuilder.andWhere('provider.isVerified = :isVerified', {
        isVerified: query.verificationStatus === 'verified',
      });
    }

    if (query.type) {
      queryBuilder.andWhere('provider.type = :type', {
        type: query.type,
      });
    }

    const [providers, total] = await queryBuilder.getManyAndCount();

    return {
      providers: providers.map((provider) =>
        this.mapProviderListItem(provider as ProviderWithCounts),
      ),
      total,
    };
  }

  private async assertAdminUser(user: RequestUser): Promise<void> {
    if (user.role !== 'admin' && user.role !== 'platform_admin') {
      throw new ForbiddenException('Only admins can access providers');
    }

    const admin = await this.usersRepository.findOne({
      where: {
        id: user.id,
        isActive: true,
      },
      relations: {
        role: true,
      },
    });

    if (
      !admin ||
      admin.role.name !== user.role ||
      (admin.role.name !== 'admin' && admin.role.name !== 'platform_admin')
    ) {
      throw new ForbiddenException('Only admins can access providers');
    }
  }

  private mapProviderListItem(
    provider: ProviderWithCounts,
  ): AdminProviderListItem {
    return {
      id: provider.id,
      tenantId: provider.tenantId,
      displayName: provider.displayName,
      type: provider.type,
      verificationStatus: provider.isVerified ? 'verified' : 'unverified',
      isVerified: provider.isVerified,
      ownerName: provider.ownerUser?.fullName ?? null,
      ownerEmail: provider.ownerUser?.email ?? null,
      city: provider.city?.name ?? null,
      address: provider.address,
      servicesCount: provider.servicesCount ?? 0,
      documentsCount: provider.documentsCount ?? 0,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }
}

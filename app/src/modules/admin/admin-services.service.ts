import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestUser } from '../auth/jwt-auth.guard';
import { Service, User } from '../shared/entities';
import { AdminServicesQueryDto } from './dto/admin-services-query.dto';

export type AdminServiceListItem = {
  id: number;
  tenantId: number;
  title: string;
  description: string | null;
  basePrice: string;
  isActive: boolean;
  status: 'active' | 'inactive';
  category: {
    id: number;
    name: string;
  } | null;
  provider: {
    id: number;
    displayName: string;
    isVerified: boolean;
  } | null;
  coverImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminServicesResponse = {
  services: AdminServiceListItem[];
  total: number;
};

@Injectable()
export class AdminServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async getServices(
    user: RequestUser,
    query: AdminServicesQueryDto,
  ): Promise<AdminServicesResponse> {
    await this.assertAdminUser(user);

    const queryBuilder = this.servicesRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.provider', 'provider')
      .leftJoinAndSelect('service.category', 'category')
      .leftJoinAndSelect('service.images', 'images')
      .orderBy('service.createdAt', 'DESC')
      .addOrderBy('images.sortOrder', 'ASC');

    const search = query.search?.trim().toLowerCase();

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(service.title) LIKE :search OR LOWER(service.description) LIKE :search OR LOWER(provider.displayName) LIKE :search OR LOWER(category.name) LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (query.providerId) {
      queryBuilder.andWhere('service.providerId = :providerId', {
        providerId: query.providerId,
      });
    }

    if (query.categoryId) {
      queryBuilder.andWhere('service.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.status) {
      queryBuilder.andWhere('service.isActive = :isActive', {
        isActive: query.status === 'active',
      });
    }

    const [services, total] = await queryBuilder.getManyAndCount();

    return {
      services: services.map((service) => this.mapServiceListItem(service)),
      total,
    };
  }

  private async assertAdminUser(user: RequestUser): Promise<void> {
    if (user.role !== 'admin' && user.role !== 'platform_admin') {
      throw new ForbiddenException('Only admins can access services');
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
      throw new ForbiddenException('Only admins can access services');
    }
  }

  private mapServiceListItem(service: Service): AdminServiceListItem {
    return {
      id: service.id,
      tenantId: service.tenantId,
      title: service.title,
      description: service.description,
      basePrice: service.basePrice,
      isActive: service.isActive,
      status: service.isActive ? 'active' : 'inactive',
      category: service.category
        ? {
            id: service.category.id,
            name: service.category.name,
          }
        : null,
      provider: service.provider
        ? {
            id: service.provider.id,
            displayName: service.provider.displayName,
            isVerified: service.provider.isVerified,
          }
        : null,
      coverImageUrl: service.images?.[0]?.imageUrl ?? null,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../shared/entities';

export type ServicesListResponse = {
  services: {
    id: number;
    tenantId: number;
    title: string;
    description: string | null;
    basePrice: string;
    isActive: boolean;
    category: {
      id: number;
      name: string;
    } | null;
    provider: {
      id: number;
      displayName: string;
      description: string | null;
    } | null;
    coverImageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
};

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
  ) {}

  async getServices(tenantId: number): Promise<ServicesListResponse> {
    const services = await this.servicesRepository.find({
      where: {
        tenantId,
        isActive: true,
      },
      relations: {
        category: true,
        provider: true,
        images: true,
      },
      order: {
        createdAt: 'DESC',
        images: {
          sortOrder: 'ASC',
        },
      },
    });

    return {
      services: services.map((service) => ({
        id: service.id,
        tenantId: service.tenantId,
        title: service.title,
        description: service.description,
        basePrice: service.basePrice,
        isActive: service.isActive,
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
              description: service.provider.description,
            }
          : null,
        coverImageUrl: service.images[0]?.imageUrl ?? null,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      })),
    };
  }

  async getById(id: number, tenantId: number) {
    const service = await this.servicesRepository.findOne({
      where: { id, tenantId },
      relations: {
        category: true,
        provider: true,
        images: true,
      },
      order: {
        images: {
          sortOrder: 'ASC',
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found for the current tenant');
    }

    return {
      id: service.id,
      tenantId: service.tenantId,
      provider: {
        id: service.provider.id,
        displayName: service.provider.displayName,
        description: service.provider.description,
      },
      category: {
        id: service.category.id,
        name: service.category.name,
      },
      title: service.title,
      description: service.description,
      basePrice: service.basePrice,
      isActive: service.isActive,
      images: service.images.map((image) => ({
        id: image.id,
        imageUrl: image.imageUrl,
        sortOrder: image.sortOrder,
      })),
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }
}

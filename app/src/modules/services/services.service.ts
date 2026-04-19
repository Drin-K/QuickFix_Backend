import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../shared/entities';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
  ) {}

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

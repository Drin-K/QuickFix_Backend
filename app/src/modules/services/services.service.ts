import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RequestUser } from '../auth/jwt-auth.guard';
import { Category, Provider, Service, ServiceImage } from '../shared/entities';
import { CreateProviderServiceDto } from './dto/create-provider-service.dto';
import { UpdateProviderServiceDto } from './dto/update-provider-service.dto';

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

    @InjectRepository(Provider)
    private readonly providersRepository: Repository<Provider>,

    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,

    private readonly dataSource: DataSource,
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

  async getMyProviderServices(user: RequestUser): Promise<ServicesListResponse> {
    const provider = await this.getCurrentProvider(user);

    const services = await this.servicesRepository.find({
      where: {
        tenantId: provider.tenantId,
        providerId: provider.id,
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
      services: services.map((service) => this.mapServiceListItem(service)),
    };
  }

  async createProviderService(
    user: RequestUser,
    dto: CreateProviderServiceDto,
  ) {
    const provider = await this.getCurrentProvider(user);
    this.ensureProviderCanPublishServices(provider);
    await this.ensureCategoryExists(dto.categoryId);

    const service = await this.dataSource.transaction(async (manager) => {
      const servicesRepository = manager.getRepository(Service);
      const serviceImagesRepository = manager.getRepository(ServiceImage);

      const createdService = servicesRepository.create({
        tenantId: provider.tenantId,
        providerId: provider.id,
        categoryId: dto.categoryId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        basePrice: this.formatPrice(dto.basePrice),
        isActive: dto.isActive ?? true,
      });

      const savedService = await servicesRepository.save(createdService);

      if (dto.imageUrls?.length) {
        await serviceImagesRepository.save(
          this.buildServiceImages(
            dto.imageUrls,
            provider.tenantId,
            savedService.id,
            serviceImagesRepository,
          ),
        );
      }

      return servicesRepository.findOneOrFail({
        where: {
          id: savedService.id,
          tenantId: provider.tenantId,
          providerId: provider.id,
        },
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
    });

    return this.mapProviderServiceResponse(service);
  }

  async updateProviderService(
    id: number,
    user: RequestUser,
    dto: UpdateProviderServiceDto,
  ) {
    const provider = await this.getCurrentProvider(user);
    const service = await this.getOwnedProviderService(id, provider);

    if (dto.isActive === true) {
      this.ensureProviderCanPublishServices(provider);
    }

    if (dto.categoryId !== undefined) {
      await this.ensureCategoryExists(dto.categoryId);
    }

    const updatedService = await this.dataSource.transaction(async (manager) => {
      const servicesRepository = manager.getRepository(Service);
      const serviceImagesRepository = manager.getRepository(ServiceImage);

      if (dto.categoryId !== undefined) {
        service.categoryId = dto.categoryId;
      }

      if (dto.title !== undefined) {
        service.title = dto.title.trim();
      }

      if (dto.description !== undefined) {
        service.description = dto.description?.trim() || null;
      }

      if (dto.basePrice !== undefined) {
        service.basePrice = this.formatPrice(dto.basePrice);
      }

      if (dto.isActive !== undefined) {
        service.isActive = dto.isActive;
      }

      await servicesRepository.save(service);

      if (dto.imageUrls !== undefined) {
        await serviceImagesRepository.delete({
          tenantId: provider.tenantId,
          serviceId: service.id,
        });

        if (dto.imageUrls.length) {
          await serviceImagesRepository.save(
            this.buildServiceImages(
              dto.imageUrls,
              provider.tenantId,
              service.id,
              serviceImagesRepository,
            ),
          );
        }
      }

      return servicesRepository.findOneOrFail({
        where: {
          id: service.id,
          tenantId: provider.tenantId,
          providerId: provider.id,
        },
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
    });

    return this.mapProviderServiceResponse(updatedService);
  }

  async deleteProviderService(id: number, user: RequestUser) {
    const provider = await this.getCurrentProvider(user);
    const service = await this.getOwnedProviderService(id, provider);

    if (!service.isActive) {
      return {
        message: 'Service deleted successfully',
        serviceId: service.id,
        isActive: false,
      };
    }

    service.isActive = false;
    await this.servicesRepository.save(service);

    return {
      message: 'Service deleted successfully',
      serviceId: service.id,
      isActive: false,
    };
  }

  private async getCurrentProvider(user: RequestUser): Promise<Provider> {
    if (user.role !== 'provider') {
      throw new ForbiddenException('Only providers can access provider tools');
    }

    if (!user.tenantId) {
      throw new UnauthorizedException('Invalid tenant context');
    }

    const provider = await this.providersRepository.findOne({
      where: {
        ownerUserId: user.id,
        tenantId: user.tenantId,
      },
    });

    if (!provider) {
      throw new UnauthorizedException('Provider not found for current user');
    }

    return provider;
  }

  private async getOwnedProviderService(
    id: number,
    provider: Provider,
  ): Promise<Service> {
    const service = await this.servicesRepository.findOne({
      where: {
        id,
        tenantId: provider.tenantId,
        providerId: provider.id,
      },
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
      throw new NotFoundException(
        'Service not found for the authenticated provider',
      );
    }

    return service;
  }

  private async ensureCategoryExists(categoryId: number): Promise<void> {
    const exists = await this.categoriesRepository.exists({
      where: { id: categoryId },
    });

    if (!exists) {
      throw new BadRequestException('Category does not exist');
    }
  }

  private ensureProviderCanPublishServices(provider: Provider): void {
    if (!provider.isVerified) {
      throw new ForbiddenException(
        'Provider verification is required before creating or publishing services. Complete provider setup and document verification first.',
      );
    }
  }

  private buildServiceImages(
    imageUrls: string[],
    tenantId: number,
    serviceId: number,
    serviceImagesRepository: Repository<ServiceImage>,
  ): ServiceImage[] {
    return imageUrls
      .map((imageUrl) => imageUrl.trim())
      .filter((imageUrl) => imageUrl.length > 0)
      .map((imageUrl, index) =>
        serviceImagesRepository.create({
          tenantId,
          serviceId,
          imageUrl,
          sortOrder: index,
        }),
      );
  }

  private formatPrice(price: number): string {
    return price.toFixed(2);
  }

  private mapServiceListItem(service: Service) {
    return {
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
    };
  }

  private mapProviderServiceResponse(service: Service) {
    return {
      id: service.id,
      tenantId: service.tenantId,
      provider: service.provider
        ? {
            id: service.provider.id,
            displayName: service.provider.displayName,
            description: service.provider.description,
          }
        : null,
      category: service.category
        ? {
            id: service.category.id,
            name: service.category.name,
          }
        : null,
      title: service.title,
      description: service.description,
      basePrice: service.basePrice,
      isActive: service.isActive,
      coverImageUrl: service.images[0]?.imageUrl ?? null,
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

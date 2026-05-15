import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestUser } from '../auth/jwt-auth.guard';
import { Provider, ProviderDocument, Service, User } from '../shared/entities';
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

export type AdminProviderCompanyDetails = {
  id: number;
  tenantId: number;
  providerId: number;
  businessName: string;
  businessNumber: string | null;
  website: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminProviderIndividualDetails = {
  id: number;
  tenantId: number;
  providerId: number;
  professionTitle: string;
  yearsOfExperience: number | null;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminProviderDocumentItem = {
  id: number;
  tenantId: number;
  providerId: number;
  documentType: string;
  fileUrl: string;
  isVerified: boolean;
  status: 'verified' | 'pending';
  createdAt: Date;
};

export type AdminProviderServiceSummaryItem = {
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
  coverImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AdminProviderDetailsResponse = {
  provider: {
    id: number;
    tenantId: number;
    ownerUserId: number;
    displayName: string;
    type: 'company' | 'individual';
    description: string | null;
    city: {
      id: number;
      name: string;
    } | null;
    address: string | null;
    isVerified: boolean;
    verificationStatus: 'verified' | 'unverified';
    averageRating: string | null;
    servicesCount: number;
    documentsCount: number;
    owner: {
      id: number;
      fullName: string;
      email: string;
      phone: string | null;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    } | null;
    tenant: {
      id: number;
      name: string;
    } | null;
    createdAt: Date;
    updatedAt: Date;
  };
  details: {
    type: 'company' | 'individual';
    companyDetails: AdminProviderCompanyDetails | null;
    individualDetails: AdminProviderIndividualDetails | null;
  };
  companyDetails: AdminProviderCompanyDetails | null;
  individualDetails: AdminProviderIndividualDetails | null;
  documents: AdminProviderDocumentItem[];
  servicesSummary: {
    totalCount: number;
    totalServices: number;
    activeCount: number;
    activeServices: number;
    inactiveCount: number;
    inactiveServices: number;
    recentServices: AdminProviderServiceSummaryItem[];
    services: AdminProviderServiceSummaryItem[];
    items: AdminProviderServiceSummaryItem[];
  };
  verificationInfo: {
    isVerified: boolean;
    status: 'verified' | 'pending' | 'unverified';
    totalDocuments: number;
    verifiedDocuments: number;
    pendingDocuments: number;
    isSetupComplete: boolean;
    statusLabel: string;
    submittedDocuments: number;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    notes: string | null;
    updatedAt: Date | null;
  };
  verification: {
    isSetupComplete: boolean;
    isVerified: boolean;
    status: 'verified' | 'pending' | 'unverified';
    statusLabel: string;
    totalDocuments: number;
    submittedDocuments: number;
    verifiedDocuments: number;
    pendingDocuments: number;
    reviewedBy: string | null;
    reviewedAt: Date | null;
    notes: string | null;
    updatedAt: Date | null;
  };
};

export type AdminProviderDetailsActionResponse =
  AdminProviderDetailsResponse & {
    message: string;
  };

@Injectable()
export class AdminProvidersService {
  constructor(
    @InjectRepository(Provider)
    private readonly providersRepository: Repository<Provider>,

    @InjectRepository(ProviderDocument)
    private readonly providerDocumentsRepository: Repository<ProviderDocument>,

    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,

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

  async getProviderDetails(
    user: RequestUser,
    id: number,
  ): Promise<AdminProviderDetailsResponse> {
    await this.assertAdminUser(user);

    return this.loadProviderDetails(id);
  }

  async verifyProvider(
    user: RequestUser,
    id: number,
  ): Promise<AdminProviderDetailsActionResponse> {
    return this.updateProviderVerification(user, id, true);
  }

  async unverifyProvider(
    user: RequestUser,
    id: number,
  ): Promise<AdminProviderDetailsActionResponse> {
    return this.updateProviderVerification(user, id, false);
  }

  async verifyProviderDocument(
    user: RequestUser,
    id: number,
  ): Promise<AdminProviderDetailsActionResponse> {
    return this.updateProviderDocumentVerification(user, id, true);
  }

  async unverifyProviderDocument(
    user: RequestUser,
    id: number,
  ): Promise<AdminProviderDetailsActionResponse> {
    return this.updateProviderDocumentVerification(user, id, false);
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

  private async loadProviderDetails(
    id: number,
  ): Promise<AdminProviderDetailsResponse> {
    const provider = await this.findProviderForDetails(id);

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const services = await this.servicesRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.category', 'category')
      .leftJoinAndSelect('service.images', 'images')
      .where('service.providerId = :providerId', {
        providerId: provider.id,
      })
      .andWhere('service.tenantId = :tenantId', {
        tenantId: provider.tenantId,
      })
      .orderBy('service.createdAt', 'DESC')
      .addOrderBy('service.id', 'DESC')
      .addOrderBy('images.sortOrder', 'ASC')
      .addOrderBy('images.id', 'ASC')
      .getMany();

    const documents = this.sortDocuments(provider.documents ?? []);
    const verifiedDocuments = documents.filter(
      (document) => document.isVerified,
    );
    const companyDetails =
      provider.type === 'company' && provider.companyDetails
        ? this.mapCompanyDetails(provider.companyDetails)
        : null;
    const individualDetails =
      provider.type === 'individual' && provider.individualDetails
        ? this.mapIndividualDetails(provider.individualDetails)
        : null;
    const recentServices = services
      .slice(0, 5)
      .map((service) => this.mapServiceSummaryItem(service));
    const servicesSummary = {
      totalCount: services.length,
      totalServices: services.length,
      activeCount: services.filter((service) => service.isActive).length,
      activeServices: services.filter((service) => service.isActive).length,
      inactiveCount: services.filter((service) => !service.isActive).length,
      inactiveServices: services.filter((service) => !service.isActive).length,
      recentServices,
      services: recentServices,
      items: recentServices,
    };
    const verification: AdminProviderDetailsResponse['verificationInfo'] = {
      isSetupComplete: documents.length > 0,
      isVerified: provider.isVerified,
      status: provider.isVerified
        ? 'verified'
        : documents.length > 0
          ? 'pending'
          : 'unverified',
      statusLabel: provider.isVerified
        ? 'Verified'
        : documents.length > 0
          ? 'Under review'
          : 'Setup required',
      totalDocuments: documents.length,
      submittedDocuments: documents.length,
      verifiedDocuments: verifiedDocuments.length,
      pendingDocuments: documents.length - verifiedDocuments.length,
      reviewedBy: null,
      reviewedAt: null,
      notes: null,
      updatedAt: provider.updatedAt,
    };

    return {
      provider: this.mapProviderDetails(
        provider,
        documents.length,
        services.length,
      ),
      details: {
        type: provider.type,
        companyDetails,
        individualDetails,
      },
      companyDetails,
      individualDetails,
      documents: documents.map((document) => this.mapDocument(document)),
      servicesSummary,
      verificationInfo: verification,
      verification,
    };
  }

  private async updateProviderVerification(
    user: RequestUser,
    id: number,
    isVerified: boolean,
  ): Promise<AdminProviderDetailsActionResponse> {
    await this.assertAdminUser(user);

    const provider = await this.findProviderForDetails(id);

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    provider.isVerified = isVerified;
    await this.providersRepository.save(provider);

    return {
      message: isVerified
        ? 'Provider verified successfully.'
        : 'Provider unverified successfully.',
      ...(await this.loadProviderDetails(provider.id)),
    };
  }

  private async updateProviderDocumentVerification(
    user: RequestUser,
    id: number,
    isVerified: boolean,
  ): Promise<AdminProviderDetailsActionResponse> {
    await this.assertAdminUser(user);

    const document = await this.findProviderDocumentForVerification(id);

    if (!document) {
      throw new NotFoundException('Provider document not found');
    }

    document.isVerified = isVerified;
    await this.providerDocumentsRepository.save(document);

    const providerId = document.providerId ?? document.provider?.id;

    if (!providerId) {
      throw new NotFoundException('Provider not found');
    }

    return {
      message: isVerified
        ? 'Document verified successfully.'
        : 'Document unverified successfully.',
      ...(await this.loadProviderDetails(providerId)),
    };
  }

  private async findProviderForDetails(id: number): Promise<Provider | null> {
    const exactProvider = await this.findProviderWithDetailsRelations(id);

    if (exactProvider) {
      return exactProvider;
    }

    const tenantProvider = await this.providersRepository.findOne({
      where: {
        tenantId: id,
      },
      relations: {
        ownerUser: true,
        tenant: true,
        city: true,
        companyDetails: true,
        individualDetails: true,
        documents: true,
      },
    });

    if (tenantProvider) {
      return tenantProvider;
    }

    const ownerProvider = await this.providersRepository.findOne({
      where: {
        ownerUserId: id,
      },
      relations: {
        ownerUser: true,
        tenant: true,
        city: true,
        companyDetails: true,
        individualDetails: true,
        documents: true,
      },
    });

    if (ownerProvider) {
      return ownerProvider;
    }

    const providerDocument = await this.providerDocumentsRepository.findOne({
      where: {
        id,
      },
      relations: {
        provider: true,
      },
    });

    if (providerDocument?.providerId) {
      return this.findProviderWithDetailsRelations(providerDocument.providerId);
    }

    if (providerDocument?.provider?.id) {
      return this.findProviderWithDetailsRelations(
        providerDocument.provider.id,
      );
    }

    return null;
  }

  private async findProviderDocumentForVerification(
    id: number,
  ): Promise<ProviderDocument | null> {
    const exactDocument = await this.providerDocumentsRepository.findOne({
      where: {
        id,
      },
      relations: {
        provider: true,
      },
    });

    if (exactDocument) {
      return exactDocument;
    }

    const provider = await this.findProviderForDetails(id);

    if (!provider || provider.documents.length !== 1) {
      return null;
    }

    return provider.documents[0] ?? null;
  }

  private async findProviderWithDetailsRelations(
    id: number,
  ): Promise<Provider | null> {
    const relations = {
      ownerUser: true,
      tenant: true,
      city: true,
      companyDetails: true,
      individualDetails: true,
      documents: true,
    } as const;

    return this.providersRepository.findOne({
      where: {
        id,
      },
      relations,
    });
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

  private mapProviderDetails(
    provider: Provider,
    documentsCount: number,
    servicesCount: number,
  ): AdminProviderDetailsResponse['provider'] {
    return {
      id: provider.id,
      tenantId: provider.tenantId,
      ownerUserId: provider.ownerUserId,
      displayName: provider.displayName,
      type: provider.type,
      description: provider.description,
      city: provider.city
        ? {
            id: provider.city.id,
            name: provider.city.name,
          }
        : null,
      address: provider.address,
      isVerified: provider.isVerified,
      verificationStatus: provider.isVerified ? 'verified' : 'unverified',
      averageRating: provider.averageRating,
      servicesCount,
      documentsCount,
      owner: provider.ownerUser
        ? {
            id: provider.ownerUser.id,
            fullName: provider.ownerUser.fullName,
            email: provider.ownerUser.email,
            phone: provider.ownerUser.phone,
            isActive: provider.ownerUser.isActive,
            createdAt: provider.ownerUser.createdAt,
            updatedAt: provider.ownerUser.updatedAt,
          }
        : null,
      tenant: provider.tenant
        ? {
            id: provider.tenant.id,
            name: provider.tenant.name,
          }
        : null,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
    };
  }

  private mapCompanyDetails(
    companyDetails: NonNullable<Provider['companyDetails']>,
  ): AdminProviderCompanyDetails {
    return {
      id: companyDetails.id,
      tenantId: companyDetails.tenantId,
      providerId: companyDetails.providerId,
      businessName: companyDetails.businessName,
      businessNumber: companyDetails.businessNumber,
      website: companyDetails.website,
      createdAt: companyDetails.createdAt,
      updatedAt: companyDetails.updatedAt,
    };
  }

  private mapIndividualDetails(
    individualDetails: NonNullable<Provider['individualDetails']>,
  ): AdminProviderIndividualDetails {
    return {
      id: individualDetails.id,
      tenantId: individualDetails.tenantId,
      providerId: individualDetails.providerId,
      professionTitle: individualDetails.professionTitle,
      yearsOfExperience: individualDetails.yearsOfExperience,
      bio: individualDetails.bio,
      createdAt: individualDetails.createdAt,
      updatedAt: individualDetails.updatedAt,
    };
  }

  private mapDocument(
    document: NonNullable<Provider['documents']>[number],
  ): AdminProviderDocumentItem {
    return {
      id: document.id,
      tenantId: document.tenantId,
      providerId: document.providerId,
      documentType: document.documentType,
      fileUrl: document.fileUrl,
      isVerified: document.isVerified,
      status: document.isVerified ? 'verified' : 'pending',
      createdAt: document.createdAt,
    };
  }

  private mapServiceSummaryItem(
    service: Service,
  ): AdminProviderServiceSummaryItem {
    const coverImage = [...(service.images ?? [])]
      .sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }

        return left.id - right.id;
      })
      .at(0);

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
      coverImageUrl: coverImage?.imageUrl ?? null,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };
  }

  private sortDocuments(
    documents: NonNullable<Provider['documents']>,
  ): NonNullable<Provider['documents']> {
    return [...documents].sort((left, right) => {
      const createdAtDifference =
        right.createdAt.getTime() - left.createdAt.getTime();

      if (createdAtDifference !== 0) {
        return createdAtDifference;
      }

      return right.id - left.id;
    });
  }
}

import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestUser } from '../auth/jwt-auth.guard';
import {
  Booking,
  Provider,
  ProviderDocument,
  Service,
  User,
} from '../shared/entities';

export type AdminRecentActivity = {
  id: string;
  type: 'provider' | 'document' | 'service' | 'booking';
  title: string;
  description: string;
  occurredAt: string;
  status?: string;
  actor?: string;
};

export type AdminDashboardStats = {
  totalProviders: number;
  pendingProviders: number;
  verifiedProviders: number;
  pendingDocuments: number;
  activeServices: number;
  clientsCount: number;
  recentActivity: AdminRecentActivity[];
};

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(Provider)
    private readonly providersRepository: Repository<Provider>,
    @InjectRepository(ProviderDocument)
    private readonly providerDocumentsRepository: Repository<ProviderDocument>,
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
  ) {}

  async getStats(user: RequestUser): Promise<AdminDashboardStats> {
    await this.assertAdminUser(user);

    const [
      totalProviders,
      pendingProviders,
      verifiedProviders,
      pendingDocuments,
      activeServices,
      clientsCount,
      recentActivity,
    ] = await Promise.all([
      this.providersRepository.count(),
      this.providersRepository.count({ where: { isVerified: false } }),
      this.providersRepository.count({ where: { isVerified: true } }),
      this.providerDocumentsRepository.count({ where: { isVerified: false } }),
      this.servicesRepository.count({ where: { isActive: true } }),
      this.usersRepository.count({
        where: {
          role: {
            name: 'client',
          },
        },
        relations: {
          role: true,
        },
      }),
      this.getRecentActivity(),
    ]);

    return {
      totalProviders,
      pendingProviders,
      verifiedProviders,
      pendingDocuments,
      activeServices,
      clientsCount,
      recentActivity,
    };
  }

  private async assertAdminUser(user: RequestUser): Promise<void> {
    if (user.role !== 'admin' && user.role !== 'platform_admin') {
      throw new ForbiddenException('Only admins can access dashboard stats');
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
      throw new ForbiddenException('Only admins can access dashboard stats');
    }
  }

  private async getRecentActivity(): Promise<AdminRecentActivity[]> {
    const [providers, documents, services, bookings] = await Promise.all([
      this.providersRepository.find({
        relations: {
          ownerUser: true,
        },
        order: {
          createdAt: 'DESC',
        },
        take: 5,
      }),
      this.providerDocumentsRepository.find({
        relations: {
          provider: true,
        },
        order: {
          createdAt: 'DESC',
        },
        take: 5,
      }),
      this.servicesRepository.find({
        relations: {
          provider: true,
        },
        order: {
          createdAt: 'DESC',
        },
        take: 5,
      }),
      this.bookingsRepository.find({
        relations: {
          clientUser: true,
          provider: true,
          service: true,
          status: true,
        },
        order: {
          createdAt: 'DESC',
        },
        take: 5,
      }),
    ]);

    return [
      ...providers.map((provider) => this.mapProviderActivity(provider)),
      ...documents.map((document) => this.mapDocumentActivity(document)),
      ...services.map((service) => this.mapServiceActivity(service)),
      ...bookings.map((booking) => this.mapBookingActivity(booking)),
    ]
      .sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      )
      .slice(0, 8);
  }

  private mapProviderActivity(provider: Provider): AdminRecentActivity {
    return {
      id: `provider-${provider.id}`,
      type: 'provider',
      title: provider.isVerified
        ? 'Provider verified'
        : 'Provider awaiting verification',
      description: `${provider.displayName} registered as a ${provider.type} provider.`,
      occurredAt: provider.createdAt.toISOString(),
      status: provider.isVerified ? 'verified' : 'pending',
      actor: provider.ownerUser?.fullName ?? provider.displayName,
    };
  }

  private mapDocumentActivity(document: ProviderDocument): AdminRecentActivity {
    return {
      id: `document-${document.id}`,
      type: 'document',
      title: 'Provider document submitted',
      description: `${document.provider?.displayName ?? 'Provider'} uploaded ${document.documentType}.`,
      occurredAt: document.createdAt.toISOString(),
      status: document.isVerified ? 'verified' : 'pending',
      actor: document.provider?.displayName,
    };
  }

  private mapServiceActivity(service: Service): AdminRecentActivity {
    return {
      id: `service-${service.id}`,
      type: 'service',
      title: service.isActive ? 'Service active' : 'Service inactive',
      description: `${service.title} by ${service.provider?.displayName ?? 'provider'}.`,
      occurredAt: service.createdAt.toISOString(),
      status: service.isActive ? 'active' : 'inactive',
      actor: service.provider?.displayName,
    };
  }

  private mapBookingActivity(booking: Booking): AdminRecentActivity {
    return {
      id: `booking-${booking.id}`,
      type: 'booking',
      title: 'Booking created',
      description: `${booking.clientUser?.fullName ?? 'Client'} booked ${booking.service?.title ?? 'a service'} with ${booking.provider?.displayName ?? 'provider'}.`,
      occurredAt: booking.createdAt.toISOString(),
      status: booking.status?.name,
      actor: booking.clientUser?.fullName,
    };
  }
}

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
import {
  Booking,
  BookingStatus,
  BookingStatusHistory,
  Provider,
  ProviderCompanyDetail,
  ProviderIndividualDetail,
} from '../shared/entities';
import { SetupProviderDto } from './dto/setup-provider.dto';
import { UpdateProviderBookingStatusDto } from './dto/update-provider-booking-status.dto';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,

    @InjectRepository(BookingStatus)
    private readonly bookingStatusesRepository: Repository<BookingStatus>,

    @InjectRepository(Provider)
    private readonly providersRepository: Repository<Provider>,

    @InjectRepository(ProviderIndividualDetail)
    private readonly individualDetailsRepository: Repository<ProviderIndividualDetail>,

    @InjectRepository(ProviderCompanyDetail)
    private readonly companyDetailsRepository: Repository<ProviderCompanyDetail>,

    private readonly dataSource: DataSource,
  ) {}

  async setupProvider(user: RequestUser | undefined, dto: SetupProviderDto) {
    if (!user) {
      throw new UnauthorizedException('Authentication token is required');
    }

    if (user.role !== 'provider') {
      throw new ForbiddenException(
        'Only providers can complete provider setup',
      );
    }

    if (!user.tenantId) {
      throw new BadRequestException('Provider tenant context is required');
    }

    const tenantId = user.tenantId;

    if (dto.type === 'individual' && !dto.individualDetails) {
      throw new BadRequestException('Individual details are required');
    }

    if (dto.type === 'company' && !dto.companyDetails) {
      throw new BadRequestException('Company details are required');
    }

    const provider = await this.providersRepository.findOne({
      where: {
        ownerUserId: user.id,
        tenantId,
      },
    });

    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }

    return this.dataSource.transaction(async (manager) => {
      const providersRepository = manager.getRepository(Provider);
      const individualDetailsRepository = manager.getRepository(
        ProviderIndividualDetail,
      );
      const companyDetailsRepository = manager.getRepository(
        ProviderCompanyDetail,
      );

      provider.type = dto.type;
      provider.displayName = dto.displayName.trim();
      provider.description = dto.description?.trim() || null;
      provider.cityId = dto.cityId ?? null;
      provider.address = dto.address?.trim() || null;

      const savedProvider = await providersRepository.save(provider);

      let individualDetails: ProviderIndividualDetail | null = null;
      let companyDetails: ProviderCompanyDetail | null = null;

      if (dto.type === 'individual') {
        const details = dto.individualDetails!;

        const existingDetails = await individualDetailsRepository.findOne({
          where: {
            providerId: provider.id,
            tenantId,
          },
        });

        individualDetails =
          existingDetails ??
          individualDetailsRepository.create({
            tenantId,
            providerId: provider.id,
          });

        individualDetails.professionTitle = details.professionTitle.trim();
        individualDetails.yearsOfExperience = details.yearsOfExperience ?? null;
        individualDetails.bio = details.bio?.trim() || null;

        individualDetails =
          await individualDetailsRepository.save(individualDetails);

        await companyDetailsRepository.delete({
          providerId: provider.id,
          tenantId,
        });
      }

      if (dto.type === 'company') {
        const details = dto.companyDetails!;

        const existingDetails = await companyDetailsRepository.findOne({
          where: {
            providerId: provider.id,
            tenantId,
          },
        });

        companyDetails =
          existingDetails ??
          companyDetailsRepository.create({
            tenantId,
            providerId: provider.id,
          });

        companyDetails.businessName = details.businessName.trim();
        companyDetails.businessNumber = details.businessNumber?.trim() || null;
        companyDetails.website = details.website?.trim() || null;

        companyDetails = await companyDetailsRepository.save(companyDetails);

        await individualDetailsRepository.delete({
          providerId: provider.id,
          tenantId,
        });
      }

      return {
        message: 'Provider setup completed successfully',
        provider: {
          id: savedProvider.id,
          tenantId: savedProvider.tenantId,
          type: savedProvider.type,
          displayName: savedProvider.displayName,
          description: savedProvider.description,
          cityId: savedProvider.cityId,
          address: savedProvider.address,
          isVerified: savedProvider.isVerified,
          averageRating: savedProvider.averageRating,
        },
        individualDetails,
        companyDetails,
      };
    });
  }

  async getProviderBookings(user: RequestUser) {
    const provider = await this.getCurrentProvider(user);

    const bookings = await this.bookingsRepository.find({
      where: {
        tenantId: provider.tenantId,
        providerId: provider.id,
      },
      relations: {
        clientUser: true,
        provider: true,
        service: true,
        status: true,
      },
      order: {
        bookingDate: 'DESC',
        createdAt: 'DESC',
      },
    });

    return bookings.map((booking) => this.mapBookingResponse(booking));
  }

  async updateProviderBookingStatus(
    id: number,
    dto: UpdateProviderBookingStatusDto,
    user: RequestUser,
  ) {
    const provider = await this.getCurrentProvider(user);
    const statusName = dto.status.trim().toLowerCase();

    if (!statusName) {
      throw new BadRequestException('Booking status is required');
    }

    const booking = await this.bookingsRepository.findOne({
      where: {
        id,
        tenantId: provider.tenantId,
        providerId: provider.id,
      },
      relations: {
        clientUser: true,
        provider: true,
        service: true,
        status: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status?.name === statusName) {
      return this.mapBookingResponse(booking);
    }

    const nextStatus = await this.findOrCreateBookingStatus(statusName);
    const previousStatusId = booking.statusId;

    const updatedBooking = await this.dataSource.transaction(
      async (manager) => {
        const bookingsRepository = manager.getRepository(Booking);
        const bookingStatusHistoryRepository =
          manager.getRepository(BookingStatusHistory);

        booking.statusId = nextStatus.id;
        booking.status = nextStatus;

        await bookingsRepository.save(booking);

        const historyEntry = bookingStatusHistoryRepository.create({
          tenantId: booking.tenantId,
          bookingId: booking.id,
          oldStatusId: previousStatusId,
          newStatusId: nextStatus.id,
        });

        await bookingStatusHistoryRepository.save(historyEntry);

        return bookingsRepository.findOneOrFail({
          where: {
            id: booking.id,
            tenantId: booking.tenantId,
            providerId: provider.id,
          },
          relations: {
            clientUser: true,
            provider: true,
            service: true,
            status: true,
          },
        });
      },
    );

    return this.mapBookingResponse(updatedBooking);
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

  private async findOrCreateBookingStatus(
    name: string,
  ): Promise<BookingStatus> {
    const existingStatus = await this.bookingStatusesRepository.findOne({
      where: { name },
    });

    if (existingStatus) {
      return existingStatus;
    }

    const status = this.bookingStatusesRepository.create({ name });
    return this.bookingStatusesRepository.save(status);
  }

  private mapBookingResponse(booking: Booking) {
    return {
      id: booking.id,
      tenantId: booking.tenantId,
      bookingDate: booking.bookingDate,
      totalPrice: booking.totalPrice,
      notes: booking.notes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      status: booking.status
        ? {
            id: booking.status.id,
            name: booking.status.name,
          }
        : null,
      service: booking.service
        ? {
            id: booking.service.id,
            title: booking.service.title,
            basePrice: booking.service.basePrice,
          }
        : null,
      provider: booking.provider
        ? {
            id: booking.provider.id,
            displayName: booking.provider.displayName,
          }
        : null,
      client: booking.clientUser
        ? {
            id: booking.clientUser.id,
            fullName: booking.clientUser.fullName,
            email: booking.clientUser.email,
          }
        : null,
    };
  }
}

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RequestUser } from '../auth/jwt-auth.guard';
import {
  Booking,
  BookingStatus,
  BookingStatusHistory,
  Provider,
  Service,
  User,
} from '../shared/entities';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    @InjectRepository(BookingStatus)
    private readonly bookingStatusesRepository: Repository<BookingStatus>,
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
    @InjectRepository(Provider)
    private readonly providersRepository: Repository<Provider>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createBookingDto: CreateBookingDto,
    user: RequestUser,
    tenantId: number,
  ) {
    if (user.role !== 'client') {
      throw new ForbiddenException('Only clients can create bookings');
    }

    const client = await this.usersRepository.findOne({
      where: { id: user.id, isActive: true },
      relations: {
        role: true,
      },
    });

    if (!client || client.role.name !== 'client') {
      throw new NotFoundException('Client not found for the current booking');
    }

    const service = await this.servicesRepository.findOne({
      where: {
        id: createBookingDto.serviceId,
        tenantId,
        isActive: true,
      },
      relations: {
        provider: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found for the current tenant');
    }

    const providerId = createBookingDto.providerId ?? service.providerId;

    if (providerId !== service.providerId) {
      throw new NotFoundException(
        'Provider does not match the selected service in the current tenant',
      );
    }

    const provider = await this.providersRepository.findOne({
      where: {
        id: providerId,
        tenantId,
      },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found for the current tenant');
    }

    const pendingStatus = await this.findOrCreatePendingStatus();

    const booking = await this.dataSource.transaction(async (manager) => {
      const bookingsRepository = manager.getRepository(Booking);
      const bookingStatusHistoryRepository =
        manager.getRepository(BookingStatusHistory);

      const createdBooking = bookingsRepository.create({
        tenantId,
        clientUserId: client.id,
        providerId: provider.id,
        serviceId: service.id,
        statusId: pendingStatus.id,
        bookingDate: new Date(createBookingDto.bookingDate),
        totalPrice: service.basePrice,
        notes: createBookingDto.notes?.trim() || null,
      });

      const savedBooking = await bookingsRepository.save(createdBooking);

      const statusHistoryEntry = bookingStatusHistoryRepository.create({
        tenantId,
        bookingId: savedBooking.id,
        oldStatusId: null,
        newStatusId: pendingStatus.id,
      });

      await bookingStatusHistoryRepository.save(statusHistoryEntry);

      return bookingsRepository.findOneOrFail({
        where: { id: savedBooking.id, tenantId },
        relations: {
          clientUser: true,
          provider: true,
          service: true,
          status: true,
        },
      });
    });

    return this.mapBookingResponse(booking);
  }

  async getMyBookings(user: RequestUser, tenantId: number) {
    const bookings = await this.bookingsRepository.find({
      where: {
        tenantId,
        clientUserId: user.id,
      },
      relations: {
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

  private async findOrCreatePendingStatus(): Promise<BookingStatus> {
    const existingStatus = await this.bookingStatusesRepository.findOne({
      where: { name: 'pending' },
    });

    if (existingStatus) {
      return existingStatus;
    }

    const status = this.bookingStatusesRepository.create({ name: 'pending' });
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

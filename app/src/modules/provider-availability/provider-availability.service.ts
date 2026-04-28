import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestUser } from '../auth/jwt-auth.guard';
import { AvailabilitySlot, Provider } from '../shared/entities';
import { CreateAvailabilitySlotDto } from './dto/create-availability-slot.dto';

type AvailabilitySlotResponse = {
  id: number;
  tenantId: number;
  providerId: number;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class ProviderAvailabilityService {
  constructor(
    @InjectRepository(AvailabilitySlot)
    private readonly availabilitySlotsRepository: Repository<AvailabilitySlot>,
    @InjectRepository(Provider)
    private readonly providersRepository: Repository<Provider>,
  ) {}

  async getMyAvailability(
    user: RequestUser,
  ): Promise<AvailabilitySlotResponse[]> {
    const provider = await this.getCurrentProvider(user);

    const slots = await this.availabilitySlotsRepository.find({
      where: {
        tenantId: provider.tenantId,
        providerId: provider.id,
      },
      order: {
        startTime: 'ASC',
        createdAt: 'ASC',
      },
    });

    return slots.map((slot) => this.mapSlot(slot));
  }

  async createAvailability(
    createAvailabilitySlotDto: CreateAvailabilitySlotDto,
    user: RequestUser,
  ): Promise<AvailabilitySlotResponse> {
    const provider = await this.getCurrentProvider(user);
    const startTime = new Date(createAvailabilitySlotDto.startTime);
    const endTime = new Date(createAvailabilitySlotDto.endTime);

    this.validateSlotRange(startTime, endTime);

    const overlappingSlot = await this.availabilitySlotsRepository
      .createQueryBuilder('slot')
      .where('slot.tenant_id = :tenantId', { tenantId: provider.tenantId })
      .andWhere('slot.provider_id = :providerId', { providerId: provider.id })
      .andWhere('slot.start_time < :endTime', { endTime })
      .andWhere('slot.end_time > :startTime', { startTime })
      .getOne();

    if (overlappingSlot) {
      throw new ConflictException(
        'This availability slot overlaps with an existing slot',
      );
    }

    const slot = this.availabilitySlotsRepository.create({
      tenantId: provider.tenantId,
      providerId: provider.id,
      startTime,
      endTime,
      isBooked: false,
    });

    const savedSlot = await this.availabilitySlotsRepository.save(slot);
    return this.mapSlot(savedSlot);
  }

  async deleteAvailability(id: number, user: RequestUser): Promise<void> {
    const provider = await this.getCurrentProvider(user);

    const slot = await this.availabilitySlotsRepository.findOne({
      where: {
        id,
        tenantId: provider.tenantId,
        providerId: provider.id,
      },
    });

    if (!slot) {
      throw new NotFoundException('Availability slot not found');
    }

    if (slot.isBooked) {
      throw new ConflictException(
        'Booked availability slots cannot be deleted',
      );
    }

    await this.availabilitySlotsRepository.remove(slot);
  }

  private async getCurrentProvider(user: RequestUser): Promise<Provider> {
    if (user.role !== 'provider') {
      throw new ForbiddenException(
        'Only providers can manage availability slots',
      );
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

  private validateSlotRange(startTime: Date, endTime: Date): void {
    if (
      Number.isNaN(startTime.getTime()) ||
      Number.isNaN(endTime.getTime()) ||
      startTime >= endTime
    ) {
      throw new ConflictException(
        'Availability slot end time must be after start time',
      );
    }
  }

  private mapSlot(slot: AvailabilitySlot): AvailabilitySlotResponse {
    return {
      id: slot.id,
      tenantId: slot.tenantId,
      providerId: slot.providerId,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isBooked: slot.isBooked,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    };
  }
}

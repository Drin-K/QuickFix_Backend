import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestUser } from '../auth/jwt-auth.guard';
import { User } from '../shared/entities';
import { AdminClientsQueryDto } from './dto/admin-clients-query.dto';

type ClientWithBookingCount = User & {
  bookingCount?: number;
};

export type AdminClientListItem = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  bookingCount: number;
  createdAt: Date;
};

export type AdminClientsResponse = {
  clients: AdminClientListItem[];
  total: number;
};

@Injectable()
export class AdminClientsService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async getClients(
    user: RequestUser,
    query: AdminClientsQueryDto,
  ): Promise<AdminClientsResponse> {
    await this.assertAdminUser(user);

    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .loadRelationCountAndMap('user.bookingCount', 'user.bookings')
      .where('role.name = :roleName', { roleName: 'client' })
      .orderBy('user.createdAt', 'DESC');

    const search = query.search?.trim().toLowerCase();

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(user.fullName) LIKE :search OR LOWER(user.email) LIKE :search OR LOWER(user.phone) LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [clients, total] = await queryBuilder.getManyAndCount();

    return {
      clients: clients.map((client) =>
        this.mapClientListItem(client as ClientWithBookingCount),
      ),
      total,
    };
  }

  private async assertAdminUser(user: RequestUser): Promise<void> {
    if (user.role !== 'admin' && user.role !== 'platform_admin') {
      throw new ForbiddenException('Only admins can access clients');
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
      throw new ForbiddenException('Only admins can access clients');
    }
  }

  private mapClientListItem(
    client: ClientWithBookingCount,
  ): AdminClientListItem {
    return {
      id: client.id,
      fullName: client.fullName,
      email: client.email,
      phone: client.phone,
      bookingCount: client.bookingCount ?? 0,
      createdAt: client.createdAt,
    };
  }
}

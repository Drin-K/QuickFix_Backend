import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { BadRequestException } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, RequestUser } from '../auth/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(
    @Body() createBookingDto: CreateBookingDto,
    @Req() request: Request,
    @CurrentUser() user: RequestUser,
  ) {
    const tenantId = this.resolveTenantId(request, user);
    return this.bookingsService.create(createBookingDto, user, tenantId);
  }

  @Get('my')
  getMyBookings(@Req() request: Request, @CurrentUser() user: RequestUser) {
    const tenantId = this.resolveTenantId(request, user);
    return this.bookingsService.getMyBookings(user, tenantId);
  }

  private resolveTenantId(request: Request, user: RequestUser): number {
    if (user.tenantId) {
      return user.tenantId;
    }

    const tenantHeader = request.headers['x-tenant-id'];
    const tenantValue = Array.isArray(tenantHeader)
      ? tenantHeader[0]
      : tenantHeader;
    const tenantId = Number(tenantValue);

    if (!tenantValue || !Number.isInteger(tenantId) || tenantId <= 0) {
      throw new BadRequestException('Tenant context is required');
    }

    return tenantId;
  }
}

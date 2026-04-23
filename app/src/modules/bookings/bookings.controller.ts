import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { BadRequestException } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, RequestUser } from '../auth/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@ApiTags('Bookings')
@ApiBearerAuth('bearer')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a booking',
    description: 'Creates a booking for the authenticated client. The tenant is resolved from the JWT token or from the x-tenant-id header when tenant context is missing in the token.',
  })
  @ApiHeader({
    name: 'x-tenant-id',
    required: false,
    description: 'Tenant identifier. Required only when the authenticated token does not already contain tenant context.',
    schema: { type: 'integer', minimum: 1 },
  })
  @ApiBody({ type: CreateBookingDto })
  @ApiCreatedResponse({
    description: 'Booking created successfully.',
    schema: {
      example: {
        id: 15,
        tenantId: 3,
        bookingDate: '2026-05-10T14:00:00.000Z',
        totalPrice: '99.99',
        notes: 'Please bring the needed repair tools.',
        createdAt: '2026-04-23T16:45:00.000Z',
        updatedAt: '2026-04-23T16:45:00.000Z',
        status: { id: 1, name: 'pending' },
        service: { id: 12, title: 'Pipe Repair', basePrice: '99.99' },
        provider: { id: 5, displayName: 'QuickFix Plumbing' },
        client: { id: 9, fullName: 'Jane Client', email: 'jane@example.com' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or tenant context is missing.',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication token is missing, invalid, or expired.',
  })
  @ApiForbiddenResponse({
    description: 'Only client accounts can create bookings.',
  })
  create(
    @Body() createBookingDto: CreateBookingDto,
    @Req() request: Request,
    @CurrentUser() user: RequestUser,
  ) {
    const tenantId = this.resolveTenantId(request, user);
    return this.bookingsService.create(createBookingDto, user, tenantId);
  }

  @Get('my')
  @ApiOperation({
    summary: 'Get current user bookings',
    description: 'Returns the booking history for the authenticated user in the resolved tenant context.',
  })
  @ApiHeader({
    name: 'x-tenant-id',
    required: false,
    description: 'Tenant identifier. Required only when the authenticated token does not already contain tenant context.',
    schema: { type: 'integer', minimum: 1 },
  })
  @ApiOkResponse({
    description: 'Bookings returned successfully.',
    schema: {
      example: [
        {
          id: 15,
          tenantId: 3,
          bookingDate: '2026-05-10T14:00:00.000Z',
          totalPrice: '99.99',
          notes: 'Please bring the needed repair tools.',
          createdAt: '2026-04-23T16:45:00.000Z',
          updatedAt: '2026-04-23T16:45:00.000Z',
          status: { id: 1, name: 'pending' },
          service: { id: 12, title: 'Pipe Repair', basePrice: '99.99' },
          provider: { id: 5, displayName: 'QuickFix Plumbing' },
          client: null,
        },
      ],
    },
  })
  @ApiBadRequestResponse({
    description: 'Tenant context is missing or invalid.',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication token is missing, invalid, or expired.',
  })
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

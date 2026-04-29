import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, RequestUser } from '../auth/jwt-auth.guard';
import { UpdateProviderBookingStatusDto } from './dto/update-provider-booking-status.dto';
import { ProvidersService } from './providers.service';

@ApiTags('Provider Bookings')
@ApiBearerAuth('bearer')
@Controller('provider/bookings')
@UseGuards(JwtAuthGuard)
export class ProviderBookingsController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  @ApiOperation({
    summary: 'List provider bookings',
    description:
      'Returns only the bookings that belong to the authenticated provider.',
  })
  @ApiOkResponse({
    description: 'Provider bookings returned successfully.',
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
          client: { id: 9, fullName: 'Jane Client', email: 'jane@example.com' },
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description:
      'Authentication token is missing, invalid, or has invalid tenant context.',
  })
  @ApiForbiddenResponse({
    description: 'Only providers can access provider booking management.',
  })
  getProviderBookings(@CurrentUser() user: RequestUser) {
    return this.providersService.getProviderBookings(user);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update provider booking status',
    description:
      "Updates the status of one of the authenticated provider's own bookings and records the change in booking status history.",
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 15,
    description: 'Booking identifier.',
  })
  @ApiOkResponse({
    description: 'Booking status updated successfully.',
    schema: {
      example: {
        id: 15,
        tenantId: 3,
        bookingDate: '2026-05-10T14:00:00.000Z',
        totalPrice: '99.99',
        notes: 'Please bring the needed repair tools.',
        createdAt: '2026-04-23T16:45:00.000Z',
        updatedAt: '2026-04-24T09:00:00.000Z',
        status: { id: 2, name: 'confirmed' },
        service: { id: 12, title: 'Pipe Repair', basePrice: '99.99' },
        provider: { id: 5, displayName: 'QuickFix Plumbing' },
        client: { id: 9, fullName: 'Jane Client', email: 'jane@example.com' },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'The requested status value is invalid.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Authentication token is missing, invalid, or has invalid tenant context.',
  })
  @ApiForbiddenResponse({
    description: 'Only providers can update provider booking statuses.',
  })
  @ApiNotFoundResponse({
    description: 'Booking was not found for the authenticated provider.',
  })
  updateBookingStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProviderBookingStatusDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.providersService.updateProviderBookingStatus(id, dto, user);
  }
}

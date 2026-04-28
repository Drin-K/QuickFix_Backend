import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, RequestUser } from '../auth/jwt-auth.guard';
import { CreateAvailabilitySlotDto } from './dto/create-availability-slot.dto';
import { ProviderAvailabilityService } from './provider-availability.service';

@ApiTags('Provider Availability')
@ApiBearerAuth('bearer')
@Controller('provider/availability')
@UseGuards(JwtAuthGuard)
export class ProviderAvailabilityController {
  constructor(
    private readonly providerAvailabilityService: ProviderAvailabilityService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List provider availability slots',
    description: 'Returns the authenticated provider’s own availability slots.',
  })
  @ApiOkResponse({
    description: 'Availability slots returned successfully.',
    schema: {
      example: [
        {
          id: 7,
          tenantId: 3,
          providerId: 5,
          startTime: '2026-05-01T09:00:00.000Z',
          endTime: '2026-05-01T10:00:00.000Z',
          isBooked: false,
          createdAt: '2026-04-28T18:00:00.000Z',
          updatedAt: '2026-04-28T18:00:00.000Z',
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description:
      'Authentication token is missing, invalid, or has invalid tenant context.',
  })
  @ApiForbiddenResponse({
    description: 'Only providers can access availability management.',
  })
  getMyAvailability(@CurrentUser() user: RequestUser) {
    return this.providerAvailabilityService.getMyAvailability(user);
  }

  @Post()
  @ApiOperation({
    summary: 'Create provider availability slot',
    description:
      'Creates a new availability slot for the authenticated provider.',
  })
  @ApiCreatedResponse({
    description: 'Availability slot created successfully.',
    schema: {
      example: {
        id: 7,
        tenantId: 3,
        providerId: 5,
        startTime: '2026-05-01T09:00:00.000Z',
        endTime: '2026-05-01T10:00:00.000Z',
        isBooked: false,
        createdAt: '2026-04-28T18:00:00.000Z',
        updatedAt: '2026-04-28T18:00:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description:
      'Authentication token is missing, invalid, or has invalid tenant context.',
  })
  @ApiForbiddenResponse({
    description: 'Only providers can create availability slots.',
  })
  @ApiConflictResponse({
    description:
      'The provided slot range is invalid or overlaps with an existing slot.',
  })
  createAvailability(
    @Body() createAvailabilitySlotDto: CreateAvailabilitySlotDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.providerAvailabilityService.createAvailability(
      createAvailabilitySlotDto,
      user,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete provider availability slot',
    description:
      'Deletes one of the authenticated provider’s own availability slots.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 7,
    description: 'Availability slot identifier.',
  })
  @ApiNoContentResponse({
    description: 'Availability slot deleted successfully.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Authentication token is missing, invalid, or has invalid tenant context.',
  })
  @ApiForbiddenResponse({
    description: 'Only providers can delete availability slots.',
  })
  @ApiNotFoundResponse({
    description: 'Availability slot was not found for the current provider.',
  })
  @ApiConflictResponse({
    description: 'Booked availability slots cannot be deleted.',
  })
  deleteAvailability(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.providerAvailabilityService.deleteAvailability(id, user);
  }
}

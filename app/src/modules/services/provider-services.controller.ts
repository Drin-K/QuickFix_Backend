import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
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
import { CreateProviderServiceDto } from './dto/create-provider-service.dto';
import { UpdateProviderServiceDto } from './dto/update-provider-service.dto';
import { ServicesService } from './services.service';

@ApiTags('Provider Services')
@ApiBearerAuth('bearer')
@Controller('provider/services')
@UseGuards(JwtAuthGuard)
export class ProviderServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('my')
  @ApiOperation({
    summary: 'List current provider services',
    description:
      'Returns active services owned by the authenticated provider only.',
  })
  @ApiOkResponse({
    description: 'Provider services returned successfully.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Authentication token is missing, invalid, or has invalid tenant context.',
  })
  @ApiForbiddenResponse({
    description: 'Only providers can access provider service management.',
  })
  getMyServices(@CurrentUser() user: RequestUser) {
    return this.servicesService.getMyProviderServices(user);
  }

  @Post()
  @ApiOperation({
    summary: 'Create provider service',
    description:
      'Creates a service for the authenticated provider in their tenant.',
  })
  @ApiCreatedResponse({
    description: 'Provider service created successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Request body is invalid or category does not exist.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Authentication token is missing, invalid, or has invalid tenant context.',
  })
  @ApiForbiddenResponse({
    description: 'Only providers can create provider services.',
  })
  create(
    @Body() dto: CreateProviderServiceDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.servicesService.createProviderService(user, dto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update provider service',
    description: 'Updates a service owned by the authenticated provider only.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Service identifier.',
    example: 12,
  })
  @ApiOkResponse({
    description: 'Provider service updated successfully.',
  })
  @ApiBadRequestResponse({
    description: 'Service id, request body, or category is invalid.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Authentication token is missing, invalid, or has invalid tenant context.',
  })
  @ApiForbiddenResponse({
    description: 'Only providers can update provider services.',
  })
  @ApiNotFoundResponse({
    description: 'Service was not found for the authenticated provider.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProviderServiceDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.servicesService.updateProviderService(id, user, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete provider service',
    description:
      'Deactivates a service owned by the authenticated provider only, preserving booking history.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Service identifier.',
    example: 12,
  })
  @ApiOkResponse({
    description: 'Provider service deleted successfully.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Authentication token is missing, invalid, or has invalid tenant context.',
  })
  @ApiForbiddenResponse({
    description: 'Only providers can delete provider services.',
  })
  @ApiNotFoundResponse({
    description: 'Service was not found for the authenticated provider.',
  })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.servicesService.deleteProviderService(id, user);
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, RequestUser } from '../auth/jwt-auth.guard';
import { AdminServicesService } from './admin-services.service';
import { AdminServicesQueryDto } from './dto/admin-services-query.dto';

@ApiTags('Admin Services')
@ApiBearerAuth('bearer')
@Controller('admin/services')
@UseGuards(JwtAuthGuard)
export class AdminServicesController {
  constructor(private readonly adminServicesService: AdminServicesService) {}

  @Get()
  @ApiOperation({
    summary: 'Get services for admin',
    description:
      'Returns all services for admin users with provider, category, active status, and search filters.',
  })
  @ApiOkResponse({
    description: 'Admin services returned successfully.',
    schema: {
      example: {
        services: [
          {
            id: 12,
            tenantId: 3,
            title: 'Pipe Repair',
            description: 'Fix leaks and broken pipes',
            basePrice: '99.99',
            isActive: true,
            status: 'active',
            category: { id: 1, name: 'Plumbing' },
            provider: {
              id: 5,
              displayName: 'QuickFix Plumbing',
              isVerified: true,
            },
            coverImageUrl: 'https://cdn.example.com/service-cover.jpg',
            createdAt: '2026-04-20T08:00:00.000Z',
            updatedAt: '2026-04-21T08:00:00.000Z',
          },
        ],
        total: 1,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication token is missing, invalid, or expired.',
  })
  @ApiForbiddenResponse({
    description: 'Only admins can access services.',
  })
  getServices(
    @CurrentUser() user: RequestUser,
    @Query() query: AdminServicesQueryDto,
  ) {
    return this.adminServicesService.getServices(user, query);
  }
}

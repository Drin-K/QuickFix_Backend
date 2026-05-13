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
import { AdminProvidersService } from './admin-providers.service';
import { AdminProvidersQueryDto } from './dto/admin-providers-query.dto';

@ApiTags('Admin Providers')
@ApiBearerAuth('bearer')
@Controller('admin/providers')
@UseGuards(JwtAuthGuard)
export class AdminProvidersController {
  constructor(private readonly adminProvidersService: AdminProvidersService) {}

  @Get()
  @ApiOperation({
    summary: 'Get providers for admin',
    description:
      'Returns provider profiles for admin users with basic search, verification status, and provider type filters.',
  })
  @ApiOkResponse({
    description: 'Admin providers returned successfully.',
    schema: {
      example: {
        providers: [
          {
            id: 4,
            tenantId: 2,
            displayName: 'QuickFix Plumbing',
            type: 'company',
            verificationStatus: 'verified',
            isVerified: true,
            ownerName: 'QuickFix Admin',
            ownerEmail: 'quickfix@example.com',
            city: 'Prishtina',
            address: 'Main street 12',
            servicesCount: 3,
            documentsCount: 2,
            createdAt: '2026-05-13T16:00:00.000Z',
            updatedAt: '2026-05-13T16:00:00.000Z',
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
    description: 'Only admins can access providers.',
  })
  getProviders(
    @CurrentUser() user: RequestUser,
    @Query() query: AdminProvidersQueryDto,
  ) {
    return this.adminProvidersService.getProviders(user, query);
  }
}

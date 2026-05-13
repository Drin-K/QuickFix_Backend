import { Controller, Get, UseGuards } from '@nestjs/common';
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
import { AdminDashboardService } from './admin-dashboard.service';

@ApiTags('Admin Dashboard')
@ApiBearerAuth('bearer')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard)
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Get admin dashboard stats',
    description:
      'Returns system-wide provider, document, service, client, and recent activity stats for admin users.',
  })
  @ApiOkResponse({
    description: 'Admin dashboard stats returned successfully.',
    schema: {
      example: {
        totalProviders: 6,
        pendingProviders: 2,
        verifiedProviders: 4,
        pendingDocuments: 3,
        activeServices: 12,
        clientsCount: 8,
        recentActivity: [
          {
            id: 'document-12',
            type: 'document',
            title: 'Provider document submitted',
            description: 'QuickFix Plumbing uploaded business_license.',
            occurredAt: '2026-05-13T16:00:00.000Z',
            status: 'pending',
            actor: 'QuickFix Plumbing',
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication token is missing, invalid, or expired.',
  })
  @ApiForbiddenResponse({
    description: 'Only admins can access dashboard stats.',
  })
  getStats(@CurrentUser() user: RequestUser) {
    return this.adminDashboardService.getStats(user);
  }
}

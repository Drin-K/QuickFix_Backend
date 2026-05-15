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
import { AdminClientsService } from './admin-clients.service';
import { AdminClientsQueryDto } from './dto/admin-clients-query.dto';

@ApiTags('Admin Clients')
@ApiBearerAuth('bearer')
@Controller('admin/clients')
@UseGuards(JwtAuthGuard)
export class AdminClientsController {
  constructor(private readonly adminClientsService: AdminClientsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get clients for admin',
    description:
      'Returns client users for admin users with basic contact information, booking count, and search.',
  })
  @ApiOkResponse({
    description: 'Admin clients returned successfully.',
    schema: {
      example: {
        clients: [
          {
            id: 12,
            fullName: 'Arta Krasniqi',
            email: 'arta@example.com',
            phone: '+38344111000',
            bookingCount: 4,
            createdAt: '2026-05-13T16:00:00.000Z',
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
    description: 'Only admins can access clients.',
  })
  getClients(
    @CurrentUser() user: RequestUser,
    @Query() query: AdminClientsQueryDto,
  ) {
    return this.adminClientsService.getClients(user, query);
  }
}

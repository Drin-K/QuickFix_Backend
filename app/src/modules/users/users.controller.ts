import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, RequestUser } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth('bearer')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get authenticated user profile',
    description:
      'Returns the current authenticated user and provider or tenant context when applicable.',
  })
  @ApiOkResponse({
    description: 'Authenticated user profile returned successfully.',
    schema: {
      example: {
        id: 4,
        email: 'provider@example.com',
        fullName: 'QuickFix Plumbing',
        phone: null,
        role: 'provider',
        tenantId: 3,
        tenant: { id: 3, name: 'QuickFix Plumbing' },
        provider: {
          id: 5,
          type: 'individual',
          displayName: 'QuickFix Plumbing',
          description: null,
          cityId: null,
          address: null,
          isVerified: false,
          averageRating: null,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description:
      'Authentication token is missing, invalid, expired, or has an invalid tenant context.',
  })
  @ApiNotFoundResponse({
    description: 'Authenticated user was not found.',
  })
  getMe(@CurrentUser() user: RequestUser | undefined) {
    return this.usersService.getMe(user);
  }
}

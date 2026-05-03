import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
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
import { SetupProviderDto } from './dto/setup-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { ProvidersService } from './providers.service';

@ApiTags('Providers')
@ApiBearerAuth('bearer')
@Controller('providers')
@UseGuards(JwtAuthGuard)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get('me')
  getMe(@CurrentUser() user: RequestUser) {
    return this.providersService.getMe(user);
  }

  @Put('me')
  updateMe(@CurrentUser() user: RequestUser, @Body() dto: UpdateProviderDto) {
    return this.providersService.updateMe(user, dto);
  }

  @Post('setup')
  setupProvider(
    @CurrentUser() user: RequestUser | undefined,
    @Body() dto: SetupProviderDto,
  ) {
    return this.providersService.setupProvider(user, dto);
  }

  @Get('me/verification-status')
  @ApiOperation({
    summary: 'Get current provider verification status',
    description:
      'Returns the verification status for the authenticated provider profile.',
  })
  @ApiOkResponse({
    description: 'Provider verification status returned successfully.',
    schema: {
      example: {
        providerId: 5,
        tenantId: 3,
        isVerified: false,
        status: 'pending',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description:
      'Authentication token is missing, invalid, or has invalid tenant context.',
  })
  @ApiForbiddenResponse({
    description: 'Only providers can access provider verification status.',
  })
  getVerificationStatus(@CurrentUser() user: RequestUser) {
    return this.providersService.getVerificationStatus(user);
  }
}

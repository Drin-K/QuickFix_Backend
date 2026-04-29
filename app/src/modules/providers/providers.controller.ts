import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, RequestUser } from '../auth/jwt-auth.guard';
import { SetupProviderDto } from './dto/setup-provider.dto';
import { ProvidersService } from './providers.service';

@Controller('providers')
@UseGuards(JwtAuthGuard)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Post('setup')
  setupProvider(
    @CurrentUser() user: RequestUser | undefined,
    @Body() dto: SetupProviderDto,
  ) {
    return this.providersService.setupProvider(user, dto);
  }
}

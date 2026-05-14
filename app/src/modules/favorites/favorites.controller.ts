import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
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
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { FavoritesService } from './favorites.service';

@ApiTags('Favorites')
@ApiBearerAuth('bearer')
@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get('my')
  @ApiOperation({
    summary: 'List current client favorites',
    description:
      'Returns the provider favorites saved by the authenticated client.',
  })
  @ApiOkResponse({
    description: 'Favorite providers returned successfully.',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication token is missing, invalid, or expired.',
  })
  @ApiForbiddenResponse({
    description: 'Only clients can access favorite providers.',
  })
  getMyFavorites(@CurrentUser() user: RequestUser) {
    return this.favoritesService.getMyFavorites(user);
  }

  @Post()
  @ApiOperation({
    summary: 'Favorite a provider',
    description:
      'Adds the selected provider to the authenticated client favorites.',
  })
  @ApiOkResponse({
    description: 'Provider added to favorites successfully.',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication token is missing, invalid, or expired.',
  })
  @ApiForbiddenResponse({
    description: 'Only clients can create favorite providers.',
  })
  @ApiNotFoundResponse({
    description: 'Provider was not found.',
  })
  @ApiConflictResponse({
    description: 'Provider is already in favorites.',
  })
  createFavorite(
    @Body() dto: CreateFavoriteDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.favoritesService.createFavorite(dto, user);
  }

  @Delete(':providerId')
  @ApiOperation({
    summary: 'Remove a provider from favorites',
    description:
      'Deletes the selected provider from the authenticated client favorites.',
  })
  @ApiParam({
    name: 'providerId',
    type: Number,
    description: 'Provider identifier.',
    example: 5,
  })
  @ApiOkResponse({
    description: 'Provider removed from favorites successfully.',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication token is missing, invalid, or expired.',
  })
  @ApiForbiddenResponse({
    description: 'Only clients can remove favorite providers.',
  })
  @ApiNotFoundResponse({
    description: 'Favorite provider was not found.',
  })
  removeFavorite(
    @Param('providerId', ParseIntPipe) providerId: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.favoritesService.removeFavorite(providerId, user);
  }
}

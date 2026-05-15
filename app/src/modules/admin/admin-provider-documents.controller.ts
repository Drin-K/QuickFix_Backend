import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
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
import { AdminProvidersService } from './admin-providers.service';

@ApiTags('Admin Provider Documents')
@ApiBearerAuth('bearer')
@Controller('admin/provider-documents')
@UseGuards(JwtAuthGuard)
export class AdminProviderDocumentsController {
  constructor(private readonly adminProvidersService: AdminProvidersService) {}

  @Patch(':id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify a provider document for admin',
    description:
      'Marks the selected provider verification document as verified.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Provider document identifier.',
    example: 12,
  })
  @ApiOkResponse({
    description: 'Provider document verified successfully.',
    schema: {
      example: {
        message: 'Document verified successfully.',
        provider: {
          id: 4,
          isVerified: false,
          verificationStatus: 'unverified',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication token is missing, invalid, or expired.',
  })
  @ApiForbiddenResponse({
    description:
      'Only admins can access provider document verification actions.',
  })
  @ApiNotFoundResponse({
    description: 'Provider document was not found.',
  })
  verifyProviderDocument(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminProvidersService.verifyProviderDocument(user, id);
  }

  @Patch(':id/unverify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unverify a provider document for admin',
    description:
      'Marks the selected provider verification document as unverified.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Provider document identifier.',
    example: 12,
  })
  @ApiOkResponse({
    description: 'Provider document unverified successfully.',
    schema: {
      example: {
        message: 'Document unverified successfully.',
        provider: {
          id: 4,
          isVerified: true,
          verificationStatus: 'verified',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication token is missing, invalid, or expired.',
  })
  @ApiForbiddenResponse({
    description:
      'Only admins can access provider document verification actions.',
  })
  @ApiNotFoundResponse({
    description: 'Provider document was not found.',
  })
  unverifyProviderDocument(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminProvidersService.unverifyProviderDocument(user, id);
  }
}

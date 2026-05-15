import {
  Controller,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
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

  @Get(':id')
  @ApiOperation({
    summary: 'Get provider details for admin',
    description:
      'Returns a rich provider profile with owner info, company or individual details, uploaded documents, recent services, and verification metadata.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Provider identifier.',
    example: 4,
  })
  @ApiOkResponse({
    description: 'Admin provider details returned successfully.',
    schema: {
      example: {
        provider: {
          id: 4,
          tenantId: 2,
          ownerUserId: 11,
          displayName: 'QuickFix Plumbing',
          type: 'company',
          description: 'Trusted plumbing help for households and offices.',
          city: {
            id: 3,
            name: 'Prishtina',
          },
          address: 'Main street 12',
          isVerified: true,
          verificationStatus: 'verified',
          averageRating: '4.90',
          servicesCount: 3,
          documentsCount: 2,
          owner: {
            id: 11,
            fullName: 'QuickFix Admin',
            email: 'quickfix@example.com',
            phone: '+38344111002',
            isActive: true,
            createdAt: '2026-04-15T09:00:00.000Z',
            updatedAt: '2026-05-13T16:00:00.000Z',
          },
          tenant: {
            id: 2,
            name: 'QuickFix Kosovo',
          },
          createdAt: '2026-04-15T09:00:00.000Z',
          updatedAt: '2026-05-13T16:00:00.000Z',
        },
        details: {
          type: 'company',
          companyDetails: {
            id: 9,
            tenantId: 2,
            providerId: 4,
            businessName: 'QuickFix Plumbing LLC',
            businessNumber: 'BIZ-10293',
            website: 'https://quickfix.example.com',
            createdAt: '2026-04-15T09:10:00.000Z',
            updatedAt: '2026-05-13T16:00:00.000Z',
          },
          individualDetails: null,
        },
        documents: [
          {
            id: 21,
            tenantId: 2,
            providerId: 4,
            documentType: 'business_license',
            fileUrl: 'https://cdn.example.com/provider-documents/license.pdf',
            isVerified: true,
            status: 'verified',
            createdAt: '2026-04-30T12:00:00.000Z',
          },
        ],
        servicesSummary: {
          totalCount: 3,
          activeCount: 3,
          inactiveCount: 0,
          recentServices: [
            {
              id: 12,
              tenantId: 2,
              title: 'Pipe Repair',
              description: 'Fix leaks and broken pipes',
              basePrice: '99.99',
              isActive: true,
              status: 'active',
              category: {
                id: 1,
                name: 'Plumbing',
              },
              coverImageUrl: 'https://cdn.example.com/service-cover.jpg',
              createdAt: '2026-04-20T08:00:00.000Z',
              updatedAt: '2026-04-21T08:00:00.000Z',
            },
          ],
        },
        verificationInfo: {
          isVerified: true,
          status: 'verified',
          totalDocuments: 2,
          verifiedDocuments: 2,
          pendingDocuments: 0,
        },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication token is missing, invalid, or expired.',
  })
  @ApiForbiddenResponse({
    description: 'Only admins can access provider details.',
  })
  @ApiNotFoundResponse({
    description: 'Provider was not found.',
  })
  getProviderDetails(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminProvidersService.getProviderDetails(user, id);
  }

  @Patch(':id/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify a provider for admin',
    description:
      'Marks the selected provider as verified for admin moderation.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Provider identifier.',
    example: 4,
  })
  @ApiOkResponse({
    description: 'Provider verified successfully.',
    schema: {
      example: {
        message: 'Provider verified successfully.',
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
    description: 'Only admins can access provider verification actions.',
  })
  @ApiNotFoundResponse({
    description: 'Provider was not found.',
  })
  verifyProvider(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminProvidersService.verifyProvider(user, id);
  }

  @Patch(':id/unverify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unverify a provider for admin',
    description:
      'Marks the selected provider as unverified for admin moderation.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Provider identifier.',
    example: 4,
  })
  @ApiOkResponse({
    description: 'Provider unverified successfully.',
    schema: {
      example: {
        message: 'Provider unverified successfully.',
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
    description: 'Only admins can access provider verification actions.',
  })
  @ApiNotFoundResponse({
    description: 'Provider was not found.',
  })
  unverifyProvider(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminProvidersService.unverifyProvider(user, id);
  }
}

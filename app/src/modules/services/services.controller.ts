import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ApiBadRequestResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ServicesService } from './services.service';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List services for a tenant',
    description: 'Returns active services for a tenant. You can provide tenant context with a Bearer token that includes tenantId or by sending the x-tenant-id header.',
  })
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: 'Optional Bearer JWT. If provided and valid, tenantId is read from the token.',
    schema: { type: 'string', example: 'Bearer <jwt-token>' },
  })
  @ApiHeader({
    name: 'x-tenant-id',
    required: false,
    description: 'Tenant identifier. Required when a bearer token is not provided or does not include tenantId.',
    schema: { type: 'integer', minimum: 1 },
  })
  @ApiOkResponse({
    description: 'Service list returned successfully.',
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
            category: { id: 1, name: 'Plumbing' },
            provider: {
              id: 5,
              displayName: 'QuickFix Plumbing',
              description: 'Emergency plumbing specialists',
            },
            coverImageUrl: 'https://cdn.example.com/service-cover.jpg',
            createdAt: '2026-04-20T08:00:00.000Z',
            updatedAt: '2026-04-21T08:00:00.000Z',
          },
        ],
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Tenant context is missing or invalid.',
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token format is invalid or the token is expired.',
  })
  getServices(@Req() request: Request) {
    const tenantId = this.resolveTenantId(request);
    return this.servicesService.getServices(tenantId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get service details',
    description: 'Returns full details for a single service within the resolved tenant context.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Service identifier.',
    example: 12,
  })
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description: 'Optional Bearer JWT. If provided and valid, tenantId is read from the token.',
    schema: { type: 'string', example: 'Bearer <jwt-token>' },
  })
  @ApiHeader({
    name: 'x-tenant-id',
    required: false,
    description: 'Tenant identifier. Required when a bearer token is not provided or does not include tenantId.',
    schema: { type: 'integer', minimum: 1 },
  })
  @ApiOkResponse({
    description: 'Service details returned successfully.',
    schema: {
      example: {
        id: 12,
        tenantId: 3,
        provider: {
          id: 5,
          displayName: 'QuickFix Plumbing',
          description: 'Emergency plumbing specialists',
        },
        category: {
          id: 1,
          name: 'Plumbing',
        },
        title: 'Pipe Repair',
        description: 'Fix leaks and broken pipes',
        basePrice: '99.99',
        isActive: true,
        images: [
          {
            id: 8,
            imageUrl: 'https://cdn.example.com/service-1.jpg',
            sortOrder: 1,
          },
        ],
        createdAt: '2026-04-20T08:00:00.000Z',
        updatedAt: '2026-04-21T08:00:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Service id or tenant context is invalid.',
  })
  @ApiUnauthorizedResponse({
    description: 'Bearer token format is invalid or the token is expired.',
  })
  @ApiNotFoundResponse({
    description: 'Service was not found for the current tenant.',
  })
  getById(@Param('id', ParseIntPipe) id: number, @Req() request: Request) {
    const tenantId = this.resolveTenantId(request);
    return this.servicesService.getById(id, tenantId);
  }

  private resolveTenantId(request: Request): number {
    const tenantIdFromToken = this.resolveTenantIdFromToken(request);

    if (tenantIdFromToken) {
      return tenantIdFromToken;
    }

    const tenantHeader = request.headers['x-tenant-id'];
    const tenantValue = Array.isArray(tenantHeader)
      ? tenantHeader[0]
      : tenantHeader;
    const tenantId = Number(tenantValue);

    if (!tenantValue || !Number.isInteger(tenantId) || tenantId <= 0) {
      throw new BadRequestException('Tenant context is required');
    }

    return tenantId;
  }

  private resolveTenantIdFromToken(request: Request): number | null {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return null;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    try {
      const payload = this.jwtService.verify<{ tenantId?: number | null }>(
        token,
        {
          secret: process.env.JWT_SECRET ?? 'quickfix-dev-secret',
        },
      );

      return payload.tenantId ?? null;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired authentication token',
      );
    }
  }
}

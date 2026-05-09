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
    summary: 'List marketplace services',
    description:
      'Returns active services across all provider tenants in the global marketplace.',
  })
  @ApiHeader({
    name: 'Authorization',
    required: false,
    description:
      'Optional Bearer JWT. Authentication does not scope the marketplace list.',
    schema: { type: 'string', example: 'Bearer <jwt-token>' },
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
    this.ensureValidOptionalAuthToken(request);
    return this.servicesService.getServices();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get service details',
    description:
      'Returns full details for a single active service from the global marketplace.',
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
    description:
      'Optional Bearer JWT. Authentication does not scope marketplace service details.',
    schema: { type: 'string', example: 'Bearer <jwt-token>' },
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
    description: 'Service was not found.',
  })
  getById(@Param('id', ParseIntPipe) id: number, @Req() request: Request) {
    this.ensureValidOptionalAuthToken(request);
    return this.servicesService.getById(id);
  }

  private ensureValidOptionalAuthToken(request: Request): void {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return;
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authentication token');
    }

    try {
      this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET ?? 'quickfix-dev-secret',
      });
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired authentication token',
      );
    }
  }
}

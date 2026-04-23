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
import { Request } from 'express';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(
    private readonly servicesService: ServicesService,
    private readonly jwtService: JwtService,
  ) {}

  @Get()
  getServices(@Req() request: Request) {
    const tenantId = this.resolveTenantId(request);
    return this.servicesService.getServices(tenantId);
  }

  @Get(':id')
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
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}

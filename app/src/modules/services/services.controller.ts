import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number, @Req() request: Request) {
    const tenantId = this.resolveTenantId(request);
    return this.servicesService.getById(id, tenantId);
  }

  private resolveTenantId(request: Request): number {
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
}

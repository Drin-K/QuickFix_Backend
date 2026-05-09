import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

describe('ServicesController', () => {
  let controller: ServicesController;
  let servicesService: {
    getServices: jest.Mock;
    getById: jest.Mock;
  };
  let jwtService: {
    verify: jest.Mock;
  };

  beforeEach(async () => {
    servicesService = {
      getServices: jest.fn(),
      getById: jest.fn(),
    };

    jwtService = {
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: ServicesService,
          useValue: servicesService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
  });

  it('validates token but keeps GET /services globally scoped', async () => {
    jwtService.verify.mockReturnValue({ tenantId: 33 });
    servicesService.getServices.mockResolvedValue({ services: [] });

    const request = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    } as Request;

    await expect(controller.getServices(request)).resolves.toEqual({
      services: [],
    });

    expect(jwtService.verify).toHaveBeenCalledWith('valid-token', {
      secret: 'quickfix-dev-secret',
    });
    expect(servicesService.getServices).toHaveBeenCalledWith();
  });

  it('ignores x-tenant-id for global marketplace services', async () => {
    servicesService.getServices.mockResolvedValue({ services: [] });

    const request = {
      headers: {
        'x-tenant-id': '8',
      },
    } as unknown as Request;

    await expect(controller.getServices(request)).resolves.toEqual({
      services: [],
    });

    expect(servicesService.getServices).toHaveBeenCalledWith();
  });

  it('returns global marketplace services when tenant context is missing', async () => {
    servicesService.getServices.mockResolvedValue({ services: [] });

    const request = {
      headers: {},
    } as Request;

    await expect(controller.getServices(request)).resolves.toEqual({
      services: [],
    });

    expect(servicesService.getServices).toHaveBeenCalledWith();
  });

  it('keeps service details globally scoped for authenticated providers', async () => {
    jwtService.verify.mockReturnValue({ tenantId: 33 });
    servicesService.getById.mockResolvedValue({ id: 5 });

    const request = {
      headers: {
        authorization: 'Bearer provider-token',
      },
    } as Request;

    await expect(controller.getById(5, request)).resolves.toEqual({ id: 5 });

    expect(servicesService.getById).toHaveBeenCalledWith(5);
  });

  it('throws when authorization header is invalid', () => {
    const request = {
      headers: {
        authorization: 'Basic abc',
      },
    } as Request;

    expect(() => controller.getServices(request)).toThrow(
      UnauthorizedException,
    );
  });
});

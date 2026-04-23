import { BadRequestException, UnauthorizedException } from '@nestjs/common';
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

  it('uses tenant id from token for GET /services', async () => {
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

    expect(servicesService.getServices).toHaveBeenCalledWith(33);
  });

  it('falls back to x-tenant-id when token is not present', async () => {
    servicesService.getServices.mockResolvedValue({ services: [] });

    const request = {
      headers: {
        'x-tenant-id': '8',
      },
    } as unknown as Request;

    await expect(controller.getServices(request)).resolves.toEqual({
      services: [],
    });

    expect(servicesService.getServices).toHaveBeenCalledWith(8);
  });

  it('throws when tenant context is missing', () => {
    const request = {
      headers: {},
    } as Request;

    expect(() => controller.getServices(request)).toThrow(BadRequestException);
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

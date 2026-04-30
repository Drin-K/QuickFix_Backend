import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProviderDocumentsController } from './provider-documents.controller';
import { ProviderDocumentsService } from './provider-documents.service';

describe('ProviderDocumentsController', () => {
  let controller: ProviderDocumentsController;
  let providerDocumentsService: {
    uploadDocument: jest.Mock;
    listDocuments: jest.Mock;
    deleteDocument: jest.Mock;
  };

  beforeEach(async () => {
    providerDocumentsService = {
      uploadDocument: jest.fn(),
      listDocuments: jest.fn(),
      deleteDocument: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProviderDocumentsController],
      providers: [
        {
          provide: ProviderDocumentsService,
          useValue: providerDocumentsService,
        },
        {
          provide: JwtAuthGuard,
          useValue: {
            canActivate: jest.fn().mockReturnValue(true),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProviderDocumentsController>(
      ProviderDocumentsController,
    );
  });

  it('uploads a document for the authenticated provider', async () => {
    const user = { id: 3, role: 'provider', tenantId: 5 } as const;
    const request = {
      protocol: 'http',
      get: jest.fn().mockReturnValue('localhost:3001'),
    } as const;
    const dto = {
      documentType: 'business_license',
      fileUrl: 'https://cdn.example.com/license.pdf',
    };

    providerDocumentsService.uploadDocument.mockResolvedValue({ id: 1 });

    await expect(
      controller.uploadDocument(dto, user, undefined, request as never),
    ).resolves.toEqual({
      id: 1,
    });
    expect(providerDocumentsService.uploadDocument).toHaveBeenCalledWith(
      dto,
      user,
      undefined,
      'http://localhost:3001',
    );
  });

  it('returns documents for the authenticated provider', async () => {
    const user = { id: 3, role: 'provider', tenantId: 5 } as const;
    providerDocumentsService.listDocuments.mockResolvedValue([]);

    await expect(controller.listDocuments(user)).resolves.toEqual([]);
    expect(providerDocumentsService.listDocuments).toHaveBeenCalledWith(user);
  });

  it('deletes a document for the authenticated provider', async () => {
    const user = { id: 3, role: 'provider', tenantId: 5 } as const;
    providerDocumentsService.deleteDocument.mockResolvedValue(undefined);

    await expect(controller.deleteDocument(7, user)).resolves.toBeUndefined();
    expect(providerDocumentsService.deleteDocument).toHaveBeenCalledWith(
      7,
      user,
    );
  });
});

import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { rm } from 'fs/promises';
import { join } from 'path';
import type { RequestUser } from '../auth/jwt-auth.guard';
import { Provider, ProviderDocument } from '../shared/entities';
import { ProviderDocumentsService } from './provider-documents.service';

describe('ProviderDocumentsService', () => {
  let service: ProviderDocumentsService;
  let providerDocumentsRepository: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let providersRepository: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    providerDocumentsRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    providersRepository = {
      findOne: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProviderDocumentsService,
        {
          provide: getRepositoryToken(ProviderDocument),
          useValue: providerDocumentsRepository,
        },
        {
          provide: getRepositoryToken(Provider),
          useValue: providersRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(ProviderDocumentsService);
  });

  afterEach(async () => {
    await rm(join(process.cwd(), 'uploads', 'provider-documents'), {
      force: true,
      recursive: true,
    });
  });

  it('uploads a document linked to the authenticated provider', async () => {
    const user: RequestUser = { id: 7, role: 'provider', tenantId: 4 };
    const createdAt = new Date('2026-04-30T12:00:00.000Z');

    providersRepository.findOne.mockResolvedValue({ id: 22, tenantId: 4 });
    providerDocumentsRepository.create.mockImplementation(
      (value: Partial<ProviderDocument>) => value,
    );
    providerDocumentsRepository.save.mockImplementation(
      (value: Partial<ProviderDocument>) =>
        Promise.resolve({
          id: 9,
          createdAt,
          ...value,
        }),
    );

    await expect(
      service.uploadDocument(
        {
          documentType: ' business_license ',
          fileUrl: ' https://cdn.example.com/license.pdf ',
        },
        user,
      ),
    ).resolves.toEqual({
      id: 9,
      tenantId: 4,
      providerId: 22,
      documentType: 'business_license',
      fileUrl: 'https://cdn.example.com/license.pdf',
      submittedAt: createdAt,
      isVerified: false,
      createdAt,
    });

    expect(providerDocumentsRepository.create).toHaveBeenCalledWith({
      tenantId: 4,
      providerId: 22,
      documentType: 'business_license',
      fileUrl: 'https://cdn.example.com/license.pdf',
      isVerified: false,
    });
  });

  it('stores uploaded files using the original file name', async () => {
    const user: RequestUser = { id: 7, role: 'provider', tenantId: 4 };
    const createdAt = new Date('2026-04-30T12:00:00.000Z');

    providersRepository.findOne.mockResolvedValue({ id: 22, tenantId: 4 });
    providerDocumentsRepository.create.mockImplementation(
      (value: Partial<ProviderDocument>) => value,
    );
    providerDocumentsRepository.save.mockImplementation(
      (value: Partial<ProviderDocument>) =>
        Promise.resolve({
          id: 9,
          createdAt,
          ...value,
        }),
    );

    await expect(
      service.uploadDocument(
        {
          documentType: 'bank_statement',
        },
        user,
        {
          buffer: Buffer.from('fake-png'),
          originalname: 'Vertetim Bankar.png',
          mimetype: 'image/png',
          size: 8,
        },
        'http://localhost:3001',
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        fileUrl:
          'http://localhost:3001/uploads/provider-documents/Vertetim%20Bankar.png',
      }),
    );

    expect(providerDocumentsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fileUrl:
          'http://localhost:3001/uploads/provider-documents/Vertetim%20Bankar.png',
      }),
    );
  });

  it('lists only documents owned by the authenticated provider', async () => {
    const user: RequestUser = { id: 7, role: 'provider', tenantId: 4 };
    const createdAt = new Date('2026-04-30T12:00:00.000Z');

    providersRepository.findOne.mockResolvedValue({ id: 22, tenantId: 4 });
    providerDocumentsRepository.find.mockResolvedValue([
      {
        id: 9,
        tenantId: 4,
        providerId: 22,
        documentType: 'business_license',
        fileUrl: 'https://cdn.example.com/license.pdf',
        isVerified: false,
        createdAt,
      },
    ]);

    await expect(service.listDocuments(user)).resolves.toEqual([
      {
        id: 9,
        tenantId: 4,
        providerId: 22,
        documentType: 'business_license',
        fileUrl: 'https://cdn.example.com/license.pdf',
        submittedAt: createdAt,
        isVerified: false,
        createdAt,
      },
    ]);

    expect(providerDocumentsRepository.find).toHaveBeenCalledWith({
      where: {
        tenantId: 4,
        providerId: 22,
      },
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
    });
  });

  it('deletes only documents owned by the authenticated provider', async () => {
    const user: RequestUser = { id: 7, role: 'provider', tenantId: 4 };
    const document = {
      id: 9,
      tenantId: 4,
      providerId: 22,
    };

    providersRepository.findOne.mockResolvedValue({ id: 22, tenantId: 4 });
    providerDocumentsRepository.findOne.mockResolvedValue(document);

    await expect(service.deleteDocument(9, user)).resolves.toBeUndefined();

    expect(providerDocumentsRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 9,
        tenantId: 4,
        providerId: 22,
      },
    });
    expect(providerDocumentsRepository.remove).toHaveBeenCalledWith(document);
  });

  it('does not delete another provider document', async () => {
    const user: RequestUser = { id: 7, role: 'provider', tenantId: 4 };

    providersRepository.findOne.mockResolvedValue({ id: 22, tenantId: 4 });
    providerDocumentsRepository.findOne.mockResolvedValue(null);

    await expect(service.deleteDocument(99, user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects non-provider users', async () => {
    const user: RequestUser = { id: 7, role: 'client', tenantId: 4 };

    await expect(service.listDocuments(user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects provider users without tenant context', async () => {
    const user: RequestUser = { id: 7, role: 'provider', tenantId: null };

    await expect(service.listDocuments(user)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

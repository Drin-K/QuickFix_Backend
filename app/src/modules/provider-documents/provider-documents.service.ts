import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { access, mkdir, writeFile } from 'fs/promises';
import { basename, extname, join, parse } from 'path';
import { Repository } from 'typeorm';
import { RequestUser } from '../auth/jwt-auth.guard';
import { Provider, ProviderDocument } from '../shared/entities';
import { UploadProviderDocumentDto } from './dto/upload-provider-document.dto';

export type UploadedProviderDocumentFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

type ProviderDocumentResponse = {
  id: number;
  tenantId: number;
  providerId: number;
  documentType: string;
  fileUrl: string;
  submittedAt: Date;
  isVerified: boolean;
  createdAt: Date;
};

@Injectable()
export class ProviderDocumentsService {
  constructor(
    @InjectRepository(ProviderDocument)
    private readonly providerDocumentsRepository: Repository<ProviderDocument>,

    @InjectRepository(Provider)
    private readonly providersRepository: Repository<Provider>,
  ) {}

  async uploadDocument(
    dto: UploadProviderDocumentDto,
    user: RequestUser,
    file?: UploadedProviderDocumentFile,
    origin?: string,
  ): Promise<ProviderDocumentResponse> {
    const provider = await this.getCurrentProvider(user);
    const fileUrl = file
      ? await this.storeUploadedFile(file, origin)
      : dto.fileUrl?.trim();

    if (!fileUrl) {
      throw new BadRequestException('Document file or fileUrl is required');
    }

    const document = this.providerDocumentsRepository.create({
      tenantId: provider.tenantId,
      providerId: provider.id,
      documentType: dto.documentType.trim(),
      fileUrl,
      isVerified: false,
    });

    const savedDocument = await this.providerDocumentsRepository.save(document);

    return this.mapDocument(savedDocument);
  }

  async listDocuments(user: RequestUser): Promise<ProviderDocumentResponse[]> {
    const provider = await this.getCurrentProvider(user);

    const documents = await this.providerDocumentsRepository.find({
      where: {
        tenantId: provider.tenantId,
        providerId: provider.id,
      },
      order: {
        createdAt: 'DESC',
        id: 'DESC',
      },
    });

    return documents.map((document) => this.mapDocument(document));
  }

  async deleteDocument(id: number, user: RequestUser): Promise<void> {
    const provider = await this.getCurrentProvider(user);

    const document = await this.providerDocumentsRepository.findOne({
      where: {
        id,
        tenantId: provider.tenantId,
        providerId: provider.id,
      },
    });

    if (!document) {
      throw new NotFoundException('Provider document not found');
    }

    await this.providerDocumentsRepository.remove(document);
  }

  private async getCurrentProvider(user: RequestUser): Promise<Provider> {
    if (user.role !== 'provider') {
      throw new ForbiddenException('Only providers can manage documents');
    }

    if (!user.tenantId) {
      throw new UnauthorizedException('Invalid tenant context');
    }

    const provider = await this.providersRepository.findOne({
      where: {
        ownerUserId: user.id,
        tenantId: user.tenantId,
      },
    });

    if (!provider) {
      throw new UnauthorizedException('Provider not found for current user');
    }

    return provider;
  }

  private mapDocument(document: ProviderDocument): ProviderDocumentResponse {
    return {
      id: document.id,
      tenantId: document.tenantId,
      providerId: document.providerId,
      documentType: document.documentType,
      fileUrl: document.fileUrl,
      submittedAt: document.createdAt,
      isVerified: document.isVerified,
      createdAt: document.createdAt,
    };
  }

  private async storeUploadedFile(
    file: UploadedProviderDocumentFile,
    origin = process.env.PUBLIC_API_URL ?? 'http://localhost:3001',
  ): Promise<string> {
    if (!file.buffer?.length) {
      throw new BadRequestException('Document file is required');
    }

    const allowedMimeTypes = new Set([
      'application/pdf',
      'image/jpeg',
      'image/png',
    ]);

    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException(
        'Only PDF, JPG, JPEG, and PNG documents are allowed',
      );
    }

    const maxFileSize = 5 * 1024 * 1024;

    if (file.size > maxFileSize) {
      throw new BadRequestException('Document file must be 5MB or smaller');
    }

    const fileName = await this.resolveStoredFileName(file.originalname);
    const uploadDirectory = join(
      process.cwd(),
      'uploads',
      'provider-documents',
    );

    await mkdir(uploadDirectory, { recursive: true });
    await writeFile(join(uploadDirectory, fileName), file.buffer);

    return `${origin.replace(/\/+$/, '')}/uploads/provider-documents/${encodeURIComponent(fileName)}`;
  }

  private async resolveStoredFileName(originalName: string): Promise<string> {
    const uploadDirectory = join(
      process.cwd(),
      'uploads',
      'provider-documents',
    );
    const safeOriginalName = this.sanitizeFileName(originalName);
    const parsedName = parse(safeOriginalName);
    const baseName = parsedName.name || 'document';
    const extension = parsedName.ext || extname(originalName) || '.bin';
    let candidate = `${baseName}${extension}`;
    let counter = 1;

    while (await this.fileExists(join(uploadDirectory, candidate))) {
      candidate = `${baseName}-${counter}${extension}`;
      counter += 1;
    }

    return candidate;
  }

  private sanitizeFileName(fileName: string): string {
    const normalizedName = basename(fileName)
      .normalize('NFC')
      .split('')
      .filter((character) => {
        const codePoint = character.codePointAt(0) ?? 0;

        return codePoint >= 32 && !'<>:"/\\|?*'.includes(character);
      })
      .join('')
      .replace(/\s+/g, ' ')
      .trim();

    return normalizedName || 'document';
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }
}

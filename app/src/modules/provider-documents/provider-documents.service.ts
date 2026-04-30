import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestUser } from '../auth/jwt-auth.guard';
import { Provider, ProviderDocument } from '../shared/entities';
import { UploadProviderDocumentDto } from './dto/upload-provider-document.dto';

type ProviderDocumentResponse = {
  id: number;
  tenantId: number;
  providerId: number;
  documentType: string;
  fileUrl: string;
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
  ): Promise<ProviderDocumentResponse> {
    const provider = await this.getCurrentProvider(user);

    const document = this.providerDocumentsRepository.create({
      tenantId: provider.tenantId,
      providerId: provider.id,
      documentType: dto.documentType.trim(),
      fileUrl: dto.fileUrl.trim(),
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
      isVerified: document.isVerified,
      createdAt: document.createdAt,
    };
  }
}

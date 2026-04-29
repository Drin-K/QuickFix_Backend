import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RequestUser } from '../auth/jwt-auth.guard';
import {
  Provider,
  ProviderCompanyDetail,
  ProviderIndividualDetail,
} from '../shared/entities';
import { SetupProviderDto } from './dto/setup-provider.dto';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(Provider)
    private readonly providersRepository: Repository<Provider>,

    @InjectRepository(ProviderIndividualDetail)
    private readonly individualDetailsRepository: Repository<ProviderIndividualDetail>,

    @InjectRepository(ProviderCompanyDetail)
    private readonly companyDetailsRepository: Repository<ProviderCompanyDetail>,

    private readonly dataSource: DataSource,
  ) {}

  async setupProvider(user: RequestUser | undefined, dto: SetupProviderDto) {
    if (!user) {
      throw new UnauthorizedException('Authentication token is required');
    }

    if (user.role !== 'provider') {
      throw new ForbiddenException('Only providers can complete provider setup');
    }

    if (!user.tenantId) {
      throw new BadRequestException('Provider tenant context is required');
    }

    const tenantId = user.tenantId;

    if (dto.type === 'individual' && !dto.individualDetails) {
      throw new BadRequestException('Individual details are required');
    }

    if (dto.type === 'company' && !dto.companyDetails) {
      throw new BadRequestException('Company details are required');
    }

    const provider = await this.providersRepository.findOne({
      where: {
        ownerUserId: user.id,
        tenantId,
      },
    });

    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }

    return this.dataSource.transaction(async (manager) => {
      const providersRepository = manager.getRepository(Provider);
      const individualDetailsRepository = manager.getRepository(
        ProviderIndividualDetail,
      );
      const companyDetailsRepository = manager.getRepository(
        ProviderCompanyDetail,
      );

      provider.type = dto.type;
      provider.displayName = dto.displayName.trim();
      provider.description = dto.description?.trim() || null;
      provider.cityId = dto.cityId ?? null;
      provider.address = dto.address?.trim() || null;

      const savedProvider = await providersRepository.save(provider);

      let individualDetails: ProviderIndividualDetail | null = null;
      let companyDetails: ProviderCompanyDetail | null = null;

      if (dto.type === 'individual') {
        const details = dto.individualDetails!;

        const existingDetails = await individualDetailsRepository.findOne({
          where: {
            providerId: provider.id,
            tenantId,
          },
        });

        individualDetails =
          existingDetails ??
          individualDetailsRepository.create({
            tenantId,
            providerId: provider.id,
          });

        individualDetails.professionTitle = details.professionTitle.trim();
        individualDetails.yearsOfExperience =
          details.yearsOfExperience ?? null;
        individualDetails.bio = details.bio?.trim() || null;

        individualDetails =
          await individualDetailsRepository.save(individualDetails);

        await companyDetailsRepository.delete({
          providerId: provider.id,
          tenantId,
        });
      }

      if (dto.type === 'company') {
        const details = dto.companyDetails!;

        const existingDetails = await companyDetailsRepository.findOne({
          where: {
            providerId: provider.id,
            tenantId,
          },
        });

        companyDetails =
          existingDetails ??
          companyDetailsRepository.create({
            tenantId,
            providerId: provider.id,
          });

        companyDetails.businessName = details.businessName.trim();
        companyDetails.businessNumber =
          details.businessNumber?.trim() || null;
        companyDetails.website = details.website?.trim() || null;

        companyDetails = await companyDetailsRepository.save(companyDetails);

        await individualDetailsRepository.delete({
          providerId: provider.id,
          tenantId,
        });
      }

      return {
        message: 'Provider setup completed successfully',
        provider: {
          id: savedProvider.id,
          tenantId: savedProvider.tenantId,
          type: savedProvider.type,
          displayName: savedProvider.displayName,
          description: savedProvider.description,
          cityId: savedProvider.cityId,
          address: savedProvider.address,
          isVerified: savedProvider.isVerified,
          averageRating: savedProvider.averageRating,
        },
        individualDetails,
        companyDetails,
      };
    });
  }
}

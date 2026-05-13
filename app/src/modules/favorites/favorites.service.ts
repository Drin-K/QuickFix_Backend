import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestUser } from '../auth/jwt-auth.guard';
import { Favorite, Provider } from '../shared/entities';
import { CreateFavoriteDto } from './dto/create-favorite.dto';

type FavoriteProviderResponse = {
  id: number;
  tenantId: number;
  displayName: string;
  description: string | null;
  isVerified: boolean;
  averageRating: string | null;
};

type FavoriteItemResponse = {
  id: number;
  providerId: number;
  createdAt: Date;
  provider: FavoriteProviderResponse;
};

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoritesRepository: Repository<Favorite>,

    @InjectRepository(Provider)
    private readonly providersRepository: Repository<Provider>,
  ) {}

  async getMyFavorites(user: RequestUser) {
    this.ensureClientUser(user);

    const favorites = await this.favoritesRepository.find({
      where: {
        clientUserId: user.id,
      },
      relations: {
        provider: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return {
      favorites: favorites.map((favorite) => this.mapFavorite(favorite)),
    };
  }

  async createFavorite(dto: CreateFavoriteDto, user: RequestUser) {
    this.ensureClientUser(user);

    const provider = await this.providersRepository.findOne({
      where: {
        id: dto.providerId,
      },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const existingFavorite = await this.favoritesRepository.findOne({
      where: {
        clientUserId: user.id,
        providerId: provider.id,
        tenantId: provider.tenantId,
      },
      relations: {
        provider: true,
      },
    });

    if (existingFavorite) {
      throw new ConflictException('Provider is already in favorites');
    }

    const favorite = this.favoritesRepository.create({
      tenantId: provider.tenantId,
      clientUserId: user.id,
      providerId: provider.id,
    });

    const savedFavorite = await this.favoritesRepository.save(favorite);
    savedFavorite.provider = provider;

    return {
      message: 'Provider added to favorites successfully',
      favorite: this.mapFavorite(savedFavorite),
    };
  }

  async removeFavorite(providerId: number, user: RequestUser) {
    this.ensureClientUser(user);

    const favorite = await this.favoritesRepository.findOne({
      where: {
        clientUserId: user.id,
        providerId,
      },
      relations: {
        provider: true,
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite provider not found');
    }

    await this.favoritesRepository.remove(favorite);

    return {
      message: 'Provider removed from favorites successfully',
      providerId,
    };
  }

  private ensureClientUser(user: RequestUser): void {
    if (user.role !== 'client') {
      throw new ForbiddenException('Only clients can manage favorites');
    }
  }

  private mapFavorite(favorite: Favorite): FavoriteItemResponse {
    return {
      id: favorite.id,
      providerId: favorite.providerId,
      createdAt: favorite.createdAt,
      provider: {
        id: favorite.provider.id,
        tenantId: favorite.provider.tenantId,
        displayName: favorite.provider.displayName,
        description: favorite.provider.description,
        isVerified: favorite.provider.isVerified,
        averageRating: favorite.provider.averageRating,
      },
    };
  }
}

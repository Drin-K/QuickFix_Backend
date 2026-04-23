import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../shared/entities';

export type CategoriesResponse = {
  categories: {
    id: number;
    name: string;
    description: string | null;
  }[];
};

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async getCategories(): Promise<CategoriesResponse> {
    const categories = await this.categoriesRepository.find({
      order: {
        name: 'ASC',
      },
    });

    return {
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
      })),
    };
  }
}

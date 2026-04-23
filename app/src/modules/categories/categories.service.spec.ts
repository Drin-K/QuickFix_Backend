import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../shared/entities';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: jest.Mocked<Repository<Category>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: {
            find: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    repository = module.get(getRepositoryToken(Category));
  });

  it('returns mapped categories ordered by name', async () => {
    repository.find.mockResolvedValue([
      {
        id: 1,
        name: 'Electrical',
        description: 'Electrical repair services',
      },
      {
        id: 2,
        name: 'Plumbing',
        description: null,
      },
    ] as Category[]);

    await expect(service.getCategories()).resolves.toEqual({
      categories: [
        {
          id: 1,
          name: 'Electrical',
          description: 'Electrical repair services',
        },
        {
          id: 2,
          name: 'Plumbing',
          description: null,
        },
      ],
    });

    expect(repository.find.mock.calls).toEqual([
      [
        {
          order: {
            name: 'ASC',
          },
        },
      ],
    ]);
  });
});

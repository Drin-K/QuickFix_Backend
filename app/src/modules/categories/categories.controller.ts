import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({
    summary: 'List categories',
    description: 'Returns all service categories ordered alphabetically.',
  })
  @ApiOkResponse({
    description: 'Category list returned successfully.',
    schema: {
      example: {
        categories: [
          {
            id: 1,
            name: 'Plumbing',
            description: 'Plumbing repair and installation services',
          },
        ],
      },
    },
  })
  getCategories() {
    return this.categoriesService.getCategories();
  }
}

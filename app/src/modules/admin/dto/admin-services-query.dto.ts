import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class AdminServicesQueryDto {
  @ApiPropertyOptional({
    description: 'Filter services by provider id.',
    example: 4,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  providerId?: number;

  @ApiPropertyOptional({
    description: 'Filter services by category id.',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({
    description: 'Filter services by active status.',
    enum: ['active', 'inactive'],
  })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @ApiPropertyOptional({
    description:
      'Search services by title, description, provider name, or category name.',
    example: 'Pipe Repair',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}

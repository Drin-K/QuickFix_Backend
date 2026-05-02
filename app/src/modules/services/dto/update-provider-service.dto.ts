import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateProviderServiceDto {
  @ApiPropertyOptional({
    example: 2,
    minimum: 1,
    description: 'Category ID for the service.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({
    example: 'Pipe Repair',
    maxLength: 255,
    description: 'Service title shown to clients.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({
    example: 'Fix leaks and broken pipes.',
    maxLength: 2000,
    description: 'Optional service description.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    example: 99.99,
    minimum: 0,
    description: 'Base price for the service.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the service is visible to clients.',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: ['https://cdn.example.com/service-cover.jpg'],
    description:
      'Optional replacement image URLs ordered as they should appear. Send [] to remove images.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  imageUrls?: string[];
}

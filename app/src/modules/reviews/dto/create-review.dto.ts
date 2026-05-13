import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    example: 15,
    minimum: 1,
    description: 'ID of the completed booking being reviewed.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bookingId!: number;

  @ApiProperty({
    example: 5,
    minimum: 1,
    maximum: 5,
    description: 'Rating value from 1 to 5.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({
    example: 'Great service and quick communication.',
    maxLength: 2000,
    description: 'Optional written feedback for the provider.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}

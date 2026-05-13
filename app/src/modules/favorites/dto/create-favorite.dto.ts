import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class CreateFavoriteDto {
  @ApiProperty({
    example: 5,
    minimum: 1,
    description: 'Provider identifier to favorite.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  providerId!: number;
}

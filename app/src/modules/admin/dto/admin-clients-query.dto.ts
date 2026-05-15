import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminClientsQueryDto {
  @ApiPropertyOptional({
    description: 'Search clients by full name, email, or phone.',
    example: 'arta@example.com',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}

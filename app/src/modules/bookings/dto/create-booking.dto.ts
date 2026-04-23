import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    example: 12,
    minimum: 1,
    description: 'ID of the service to book. Must belong to the active tenant.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  serviceId!: number;

  @ApiPropertyOptional({
    example: 5,
    minimum: 1,
    description: 'Provider ID for the booking. Optional when the selected service already maps to a provider.',
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  providerId?: number;

  @ApiProperty({
    example: '2026-05-10T14:00:00.000Z',
    format: 'date-time',
    description: 'Requested booking date and time in ISO 8601 format.',
  })
  @IsDateString()
  bookingDate!: string;

  @ApiPropertyOptional({
    example: 'Please bring the needed repair tools.',
    maxLength: 2000,
    description: 'Optional notes from the client for the provider.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

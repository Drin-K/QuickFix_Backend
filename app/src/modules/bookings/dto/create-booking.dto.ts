import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  serviceId!: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  providerId?: number;

  @IsDateString()
  bookingDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

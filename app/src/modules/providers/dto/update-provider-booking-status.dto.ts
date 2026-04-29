import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateProviderBookingStatusDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  status!: string;
}

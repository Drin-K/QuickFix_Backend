import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SetupCompanyDetailsDto {
  @IsString()
  @MaxLength(255)
  businessName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;
}

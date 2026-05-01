import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { UpdateCompanyDetailsDto } from './update-company-details.dto';
import { UpdateIndividualDetailsDto } from './update-individual-details.dto';

export class UpdateProviderDto {
  @IsOptional()
  @IsIn(['individual', 'company'])
  type?: 'individual' | 'company';

  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cityId?: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateIndividualDetailsDto)
  individualDetails?: UpdateIndividualDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateCompanyDetailsDto)
  companyDetails?: UpdateCompanyDetailsDto;
}

import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SetupCompanyDetailsDto } from './setup-company-details.dto';
import { SetupIndividualDetailsDto } from './setup-individual-details.dto';

export class SetupProviderDto {
  @IsIn(['individual', 'company'])
  type!: 'individual' | 'company';

  @IsString()
  @MaxLength(255)
  displayName!: string;

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

  @ValidateIf((dto: SetupProviderDto) => dto.type === 'individual')
  @ValidateNested()
  @Type(() => SetupIndividualDetailsDto)
  individualDetails?: SetupIndividualDetailsDto;

  @ValidateIf((dto: SetupProviderDto) => dto.type === 'company')
  @ValidateNested()
  @Type(() => SetupCompanyDetailsDto)
  companyDetails?: SetupCompanyDetailsDto;
}

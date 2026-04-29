import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class SetupIndividualDetailsDto {
  @IsString()
  @MaxLength(255)
  professionTitle!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;

  @IsOptional()
  @IsString()
  bio?: string;
}

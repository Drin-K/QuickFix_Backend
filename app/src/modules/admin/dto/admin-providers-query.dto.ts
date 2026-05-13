import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdminProvidersQueryDto {
  @ApiPropertyOptional({
    description: 'Search providers by display name or owner name.',
    example: 'QuickFix Plumbing',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter providers by verification status.',
    enum: ['verified', 'unverified'],
  })
  @IsOptional()
  @IsIn(['verified', 'unverified'])
  verificationStatus?: 'verified' | 'unverified';

  @ApiPropertyOptional({
    description: 'Filter providers by provider type.',
    enum: ['individual', 'company'],
  })
  @IsOptional()
  @IsIn(['individual', 'company'])
  type?: 'individual' | 'company';
}

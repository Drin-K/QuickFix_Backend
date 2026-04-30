import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class UploadProviderDocumentDto {
  @ApiProperty({
    description: 'Verification document type.',
    example: 'business_license',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  documentType!: string;

  @ApiProperty({
    description:
      'URL returned by the upload storage flow for this verification document. Required for JSON requests. Multipart requests can send a file instead.',
    example: 'https://cdn.example.com/provider-documents/license.pdf',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  fileUrl?: string;

  @ApiPropertyOptional({
    description:
      'Optional original file name. This is usually set automatically for multipart uploads.',
    example: 'license.pdf',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;
}

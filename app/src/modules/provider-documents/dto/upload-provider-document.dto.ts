import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

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
      'URL returned by the upload storage flow for this verification document.',
    example: 'https://cdn.example.com/provider-documents/license.pdf',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  fileUrl!: string;
}

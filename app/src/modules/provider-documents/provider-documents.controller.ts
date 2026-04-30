import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiConsumes,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, RequestUser } from '../auth/jwt-auth.guard';
import { UploadProviderDocumentDto } from './dto/upload-provider-document.dto';
import {
  ProviderDocumentsService,
  UploadedProviderDocumentFile,
} from './provider-documents.service';

@ApiTags('Provider Documents')
@ApiBearerAuth('bearer')
@Controller(['providers/me/documents', 'provider-documents'])
@UseGuards(JwtAuthGuard)
export class ProviderDocumentsController {
  constructor(
    private readonly providerDocumentsService: ProviderDocumentsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Upload provider verification document',
    description:
      'Creates a verification document record for the authenticated provider. Supports multipart file uploads from the frontend and JSON requests with fileUrl.',
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBody({
    schema: {
      type: 'object',
      required: ['documentType'],
      properties: {
        documentType: {
          type: 'string',
          example: 'business_license',
        },
        file: {
          type: 'string',
          format: 'binary',
        },
        fileUrl: {
          type: 'string',
          example: 'https://cdn.example.com/provider-documents/license.pdf',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Provider document uploaded successfully.',
    schema: {
      example: {
        id: 12,
        tenantId: 3,
        providerId: 5,
        documentType: 'business_license',
        fileUrl: 'https://cdn.example.com/provider-documents/license.pdf',
        submittedAt: '2026-04-30T12:00:00.000Z',
        isVerified: false,
        createdAt: '2026-04-30T12:00:00.000Z',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description:
      'Authentication token is missing, invalid, or has invalid tenant context.',
  })
  @ApiForbiddenResponse({
    description: 'Only providers can upload provider documents.',
  })
  uploadDocument(
    @Body() dto: UploadProviderDocumentDto,
    @CurrentUser() user: RequestUser,
    @UploadedFile() file: UploadedProviderDocumentFile | undefined,
    @Req() request: Request,
  ) {
    return this.providerDocumentsService.uploadDocument(
      dto,
      user,
      file,
      `${request.protocol}://${request.get('host')}`,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List provider verification documents',
    description:
      "Returns the authenticated provider's uploaded verification documents.",
  })
  @ApiOkResponse({
    description: 'Provider documents returned successfully.',
    schema: {
      example: [
        {
          id: 12,
          tenantId: 3,
          providerId: 5,
          documentType: 'business_license',
          fileUrl: 'https://cdn.example.com/provider-documents/license.pdf',
          submittedAt: '2026-04-30T12:00:00.000Z',
          isVerified: false,
          createdAt: '2026-04-30T12:00:00.000Z',
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({
    description:
      'Authentication token is missing, invalid, or has invalid tenant context.',
  })
  @ApiForbiddenResponse({
    description: 'Only providers can access provider documents.',
  })
  listDocuments(@CurrentUser() user: RequestUser) {
    return this.providerDocumentsService.listDocuments(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete provider verification document',
    description:
      "Deletes one of the authenticated provider's verification documents.",
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 12,
    description: 'Provider document identifier.',
  })
  @ApiNoContentResponse({
    description: 'Provider document deleted successfully.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Authentication token is missing, invalid, or has invalid tenant context.',
  })
  @ApiForbiddenResponse({
    description: 'Only providers can delete provider documents.',
  })
  @ApiNotFoundResponse({
    description: 'Provider document was not found for the current provider.',
  })
  deleteDocument(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.providerDocumentsService.deleteDocument(id, user);
  }
}

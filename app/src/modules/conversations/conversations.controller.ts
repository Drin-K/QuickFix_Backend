import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard, RequestUser } from '../auth/jwt-auth.guard';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

@ApiTags('Conversations')
@ApiBearerAuth('bearer')
@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @ApiOperation({
    summary: 'Start a conversation with a service provider',
    description:
      'Creates or returns the existing conversation between the authenticated client and the provider behind a marketplace service.',
  })
  @ApiBody({ type: CreateConversationDto })
  @ApiCreatedResponse({
    description: 'Conversation created or returned successfully.',
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication token is missing, invalid, or expired.',
  })
  @ApiForbiddenResponse({
    description: 'Only clients can start conversations from services.',
  })
  createConversation(
    @Body() dto: CreateConversationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.conversationsService.createConversation(dto, user);
  }

  @Get('my')
  @ApiOperation({
    summary: 'List my conversations',
    description:
      'Returns conversations for the authenticated client or provider. Clients see their conversations; providers see conversations for their provider profile.',
  })
  @ApiOkResponse({
    description: 'Conversations returned successfully.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Authentication token is missing, invalid, expired, or has invalid tenant context.',
  })
  getMyConversations(@CurrentUser() user: RequestUser) {
    return this.conversationsService.getMyConversations(user);
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestUser } from '../auth/jwt-auth.guard';
import {
  Conversation,
  Message,
  MessageType,
  Provider,
  Service,
  User,
} from '../shared/entities';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationsRepository: Repository<Conversation>,

    @InjectRepository(Provider)
    private readonly providersRepository: Repository<Provider>,

    @InjectRepository(Message)
    private readonly messagesRepository: Repository<Message>,

    @InjectRepository(MessageType)
    private readonly messageTypesRepository: Repository<MessageType>,

    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,

    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async createConversation(dto: CreateConversationDto, user: RequestUser) {
    if (user.role !== 'client') {
      throw new ForbiddenException(
        'Only clients can start conversations with providers',
      );
    }

    const client = await this.usersRepository.findOne({
      where: {
        id: user.id,
        isActive: true,
      },
      relations: {
        role: true,
      },
    });

    if (!client || client.role.name !== 'client') {
      throw new NotFoundException('Client not found');
    }

    const service = await this.servicesRepository.findOne({
      where: {
        id: dto.serviceId,
        isActive: true,
      },
      relations: {
        provider: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    const existingConversation = await this.conversationsRepository.findOne({
      where: {
        tenantId: service.tenantId,
        clientUserId: client.id,
        providerId: service.providerId,
      },
      relations: {
        clientUser: true,
        provider: true,
      },
    });

    if (existingConversation) {
      return {
        conversation: this.mapConversation(existingConversation),
      };
    }

    const conversation = this.conversationsRepository.create({
      tenantId: service.tenantId,
      clientUserId: client.id,
      providerId: service.providerId,
    });

    const savedConversation =
      await this.conversationsRepository.save(conversation);

    const conversationWithRelations =
      await this.conversationsRepository.findOneOrFail({
        where: {
          id: savedConversation.id,
          tenantId: savedConversation.tenantId,
        },
        relations: {
          clientUser: true,
          provider: true,
        },
      });

    return {
      conversation: this.mapConversation(conversationWithRelations),
    };
  }

  async getMyConversations(user: RequestUser) {
    if (user.role === 'client') {
      const conversations = await this.conversationsRepository.find({
        where: {
          clientUserId: user.id,
        },
        relations: {
          clientUser: true,
          provider: true,
        },
        order: {
          createdAt: 'DESC',
        },
      });

      return {
        conversations: conversations.map((conversation) =>
          this.mapConversation(conversation),
        ),
      };
    }

    if (user.role === 'provider') {
      if (!user.tenantId) {
        throw new UnauthorizedException('Invalid tenant context');
      }

      const provider = await this.providersRepository.findOne({
        where: {
          ownerUserId: user.id,
          tenantId: user.tenantId,
        },
      });

      if (!provider) {
        throw new UnauthorizedException('Provider not found for current user');
      }

      const conversations = await this.conversationsRepository.find({
        where: {
          tenantId: provider.tenantId,
          providerId: provider.id,
        },
        relations: {
          clientUser: true,
          provider: true,
        },
        order: {
          createdAt: 'DESC',
        },
      });

      return {
        conversations: conversations.map((conversation) =>
          this.mapConversation(conversation),
        ),
      };
    }

    throw new ForbiddenException('Only clients and providers can use inbox');
  }

  async getConversation(conversationId: number, user: RequestUser) {
    const conversation = await this.getAuthorizedConversation(
      conversationId,
      user,
    );

    return {
      conversation: this.mapConversation(conversation),
    };
  }

  async getConversationMessages(conversationId: number, user: RequestUser) {
    const conversation = await this.getAuthorizedConversation(
      conversationId,
      user,
    );

    const messages = await this.messagesRepository.find({
      where: {
        tenantId: conversation.tenantId,
        conversationId: conversation.id,
      },
      relations: {
        senderUser: true,
        messageType: true,
      },
      order: {
        sentAt: 'ASC',
      },
    });

    return {
      messages: messages.map((message) => this.mapMessage(message)),
    };
  }

  async sendMessage(
    conversationId: number,
    dto: SendMessageDto,
    user: RequestUser,
  ) {
    const conversation = await this.getAuthorizedConversation(
      conversationId,
      user,
    );
    const textMessageType = await this.messageTypesRepository.findOne({
      where: {
        name: 'text',
      },
    });

    if (!textMessageType) {
      throw new NotFoundException('Text message type not found');
    }

    const content = dto.content.trim();

    if (!content) {
      throw new BadRequestException('Message content is required');
    }

    const message = this.messagesRepository.create({
      tenantId: conversation.tenantId,
      conversationId: conversation.id,
      senderUserId: user.id,
      messageTypeId: textMessageType.id,
      content,
    });

    const savedMessage = await this.messagesRepository.save(message);

    const messageWithRelations = await this.messagesRepository.findOneOrFail({
      where: {
        id: savedMessage.id,
        tenantId: savedMessage.tenantId,
      },
      relations: {
        senderUser: true,
        messageType: true,
      },
    });

    return {
      message: this.mapMessage(messageWithRelations),
    };
  }

  private async getAuthorizedConversation(
    conversationId: number,
    user: RequestUser,
  ): Promise<Conversation> {
    const conversation = await this.conversationsRepository.findOne({
      where: {
        id: conversationId,
      },
      relations: {
        clientUser: true,
        provider: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (user.role === 'client') {
      if (conversation.clientUserId !== user.id) {
        throw new ForbiddenException('Conversation access denied');
      }

      return conversation;
    }

    if (user.role === 'provider') {
      if (!user.tenantId) {
        throw new UnauthorizedException('Invalid tenant context');
      }

      const provider = await this.providersRepository.findOne({
        where: {
          ownerUserId: user.id,
          tenantId: user.tenantId,
        },
      });

      if (!provider) {
        throw new UnauthorizedException('Provider not found for current user');
      }

      if (
        conversation.tenantId !== provider.tenantId ||
        conversation.providerId !== provider.id
      ) {
        throw new ForbiddenException('Conversation access denied');
      }

      return conversation;
    }

    throw new ForbiddenException('Only clients and providers can use inbox');
  }

  private mapConversation(conversation: Conversation) {
    return {
      id: conversation.id,
      tenantId: conversation.tenantId,
      clientUserId: conversation.clientUserId,
      providerId: conversation.providerId,
      clientUser: conversation.clientUser
        ? {
            id: conversation.clientUser.id,
            fullName: conversation.clientUser.fullName,
            email: conversation.clientUser.email,
          }
        : null,
      provider: conversation.provider
        ? {
            id: conversation.provider.id,
            tenantId: conversation.provider.tenantId,
            displayName: conversation.provider.displayName,
            description: conversation.provider.description,
          }
        : null,
      createdAt: conversation.createdAt,
    };
  }

  private mapMessage(message: Message) {
    return {
      id: message.id,
      tenantId: message.tenantId,
      conversationId: message.conversationId,
      senderUserId: message.senderUserId,
      messageTypeId: message.messageTypeId,
      content: message.content,
      sentAt: message.sentAt,
      senderUser: message.senderUser
        ? {
            id: message.senderUser.id,
            fullName: message.senderUser.fullName,
            email: message.senderUser.email,
          }
        : null,
      messageType: message.messageType
        ? {
            id: message.messageType.id,
            name: message.messageType.name,
          }
        : null,
    };
  }
}

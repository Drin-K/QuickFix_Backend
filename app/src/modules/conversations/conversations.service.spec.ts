import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
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
import { ConversationsService } from './conversations.service';

describe('ConversationsService', () => {
  let service: ConversationsService;
  let conversationsRepository: jest.Mocked<Repository<Conversation>>;
  let providersRepository: jest.Mocked<Repository<Provider>>;
  let messagesRepository: jest.Mocked<Repository<Message>>;
  let messageTypesRepository: jest.Mocked<Repository<MessageType>>;
  let servicesRepository: jest.Mocked<Repository<Service>>;
  let usersRepository: jest.Mocked<Repository<User>>;

  const clientUser: RequestUser = {
    id: 31,
    role: 'client',
    tenantId: null,
  };

  const providerUser: RequestUser = {
    id: 7,
    role: 'provider',
    tenantId: 12,
  };

  const buildConversation = (
    overrides: Partial<Conversation> = {},
  ): Conversation =>
    ({
      id: 44,
      tenantId: 12,
      clientUserId: 31,
      providerId: 9,
      createdAt: new Date('2026-05-11T09:00:00.000Z'),
      clientUser: {
        id: 31,
        fullName: 'Jane Client',
        email: 'jane@example.com',
      },
      provider: {
        id: 9,
        tenantId: 12,
        displayName: 'QuickFix HVAC',
        description: 'Certified technicians',
      },
      ...overrides,
    }) as Conversation;

  const buildMessage = (overrides: Partial<Message> = {}): Message =>
    ({
      id: 70,
      tenantId: 12,
      conversationId: 44,
      senderUserId: 31,
      messageTypeId: 1,
      content: 'Hi, I would like to ask about this service.',
      sentAt: new Date('2026-05-11T09:05:00.000Z'),
      senderUser: {
        id: 31,
        fullName: 'Jane Client',
        email: 'jane@example.com',
      },
      messageType: {
        id: 1,
        name: 'text',
      },
      ...overrides,
    }) as Message;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        {
          provide: getRepositoryToken(Conversation),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            findOneOrFail: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Provider),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Message),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
            findOneOrFail: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(MessageType),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Service),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
    conversationsRepository = module.get(getRepositoryToken(Conversation));
    providersRepository = module.get(getRepositoryToken(Provider));
    messagesRepository = module.get(getRepositoryToken(Message));
    messageTypesRepository = module.get(getRepositoryToken(MessageType));
    servicesRepository = module.get(getRepositoryToken(Service));
    usersRepository = module.get(getRepositoryToken(User));
  });

  it('creates a conversation from a marketplace service using the provider tenant', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 31,
      fullName: 'Jane Client',
      email: 'jane@example.com',
      isActive: true,
      role: {
        name: 'client',
      },
    } as User);
    servicesRepository.findOne.mockResolvedValue({
      id: 5,
      tenantId: 12,
      providerId: 9,
      isActive: true,
      provider: {
        id: 9,
        tenantId: 12,
      },
    } as Service);
    conversationsRepository.findOne.mockResolvedValue(null);
    conversationsRepository.create.mockReturnValue({
      tenantId: 12,
      clientUserId: 31,
      providerId: 9,
    } as Conversation);
    conversationsRepository.save.mockResolvedValue({
      id: 44,
      tenantId: 12,
      clientUserId: 31,
      providerId: 9,
    } as Conversation);
    conversationsRepository.findOneOrFail.mockResolvedValue(
      buildConversation(),
    );

    await expect(
      service.createConversation({ serviceId: 5 }, clientUser),
    ).resolves.toEqual({
      conversation: {
        id: 44,
        tenantId: 12,
        clientUserId: 31,
        providerId: 9,
        clientUser: {
          id: 31,
          fullName: 'Jane Client',
          email: 'jane@example.com',
        },
        provider: {
          id: 9,
          tenantId: 12,
          displayName: 'QuickFix HVAC',
          description: 'Certified technicians',
        },
        createdAt: new Date('2026-05-11T09:00:00.000Z'),
      },
    });

    expect(servicesRepository.findOne.mock.calls[0]).toEqual([
      {
        where: {
          id: 5,
          isActive: true,
        },
        relations: {
          provider: true,
        },
      },
    ]);
    expect(conversationsRepository.create.mock.calls[0]).toEqual([
      {
        tenantId: 12,
        clientUserId: 31,
        providerId: 9,
      },
    ]);
  });

  it('returns the existing conversation when client already contacted provider', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 31,
      isActive: true,
      role: {
        name: 'client',
      },
    } as User);
    servicesRepository.findOne.mockResolvedValue({
      id: 5,
      tenantId: 12,
      providerId: 9,
      isActive: true,
    } as Service);
    conversationsRepository.findOne.mockResolvedValue(buildConversation());

    const result = await service.createConversation(
      { serviceId: 5 },
      clientUser,
    );

    expect(result.conversation).toEqual(
      expect.objectContaining({
        id: 44,
        tenantId: 12,
        clientUserId: 31,
        providerId: 9,
      }) as Conversation,
    );

    expect(conversationsRepository.save.mock.calls).toHaveLength(0);
  });

  it('rejects conversation creation for provider users', async () => {
    await expect(
      service.createConversation({ serviceId: 5 }, providerUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects conversation creation when service does not exist', async () => {
    usersRepository.findOne.mockResolvedValue({
      id: 31,
      isActive: true,
      role: {
        name: 'client',
      },
    } as User);
    servicesRepository.findOne.mockResolvedValue(null);

    await expect(
      service.createConversation({ serviceId: 999 }, clientUser),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists only conversations owned by the authenticated client', async () => {
    conversationsRepository.find.mockResolvedValue([buildConversation()]);

    const result = await service.getMyConversations(clientUser);

    expect(result.conversations).toEqual([
      expect.objectContaining({
        id: 44,
        clientUserId: 31,
        providerId: 9,
      }),
    ]);

    expect(conversationsRepository.find.mock.calls[0]).toEqual([
      {
        where: {
          clientUserId: 31,
        },
        relations: {
          clientUser: true,
          provider: true,
        },
        order: {
          createdAt: 'DESC',
        },
      },
    ]);
  });

  it('lists conversations for the authenticated provider profile and tenant', async () => {
    providersRepository.findOne.mockResolvedValue({
      id: 9,
      tenantId: 12,
      ownerUserId: 7,
    } as Provider);
    conversationsRepository.find.mockResolvedValue([buildConversation()]);

    const result = await service.getMyConversations(providerUser);

    expect(result.conversations).toEqual([
      expect.objectContaining({
        id: 44,
        tenantId: 12,
        providerId: 9,
      }),
    ]);

    expect(providersRepository.findOne.mock.calls[0]).toEqual([
      {
        where: {
          ownerUserId: 7,
          tenantId: 12,
        },
      },
    ]);
    expect(conversationsRepository.find.mock.calls[0]).toEqual([
      {
        where: {
          tenantId: 12,
          providerId: 9,
        },
        relations: {
          clientUser: true,
          provider: true,
        },
        order: {
          createdAt: 'DESC',
        },
      },
    ]);
  });

  it('rejects provider list access without tenant context', async () => {
    await expect(
      service.getMyConversations({
        id: 7,
        role: 'provider',
        tenantId: null,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns conversation details for the authenticated client participant', async () => {
    conversationsRepository.findOne.mockResolvedValue(buildConversation());

    const result = await service.getConversation(44, clientUser);

    expect(result.conversation).toEqual(
      expect.objectContaining({
        id: 44,
        clientUserId: 31,
        providerId: 9,
      }) as Conversation,
    );

    expect(conversationsRepository.findOne.mock.calls[0]).toEqual([
      {
        where: {
          id: 44,
        },
        relations: {
          clientUser: true,
          provider: true,
        },
      },
    ]);
  });

  it('rejects conversation details when the client is not a participant', async () => {
    conversationsRepository.findOne.mockResolvedValue(
      buildConversation({
        clientUserId: 99,
      }),
    );

    await expect(
      service.getConversation(44, clientUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns conversation details for the authenticated provider participant', async () => {
    conversationsRepository.findOne.mockResolvedValue(buildConversation());
    providersRepository.findOne.mockResolvedValue({
      id: 9,
      tenantId: 12,
      ownerUserId: 7,
    } as Provider);

    const result = await service.getConversation(44, providerUser);

    expect(result.conversation).toEqual(
      expect.objectContaining({
        id: 44,
        tenantId: 12,
        providerId: 9,
      }) as Conversation,
    );
  });

  it('lists messages for a conversation participant', async () => {
    conversationsRepository.findOne.mockResolvedValue(buildConversation());
    messagesRepository.find.mockResolvedValue([buildMessage()]);

    await expect(
      service.getConversationMessages(44, clientUser),
    ).resolves.toEqual({
      messages: [
        {
          id: 70,
          tenantId: 12,
          conversationId: 44,
          senderUserId: 31,
          messageTypeId: 1,
          content: 'Hi, I would like to ask about this service.',
          sentAt: new Date('2026-05-11T09:05:00.000Z'),
          senderUser: {
            id: 31,
            fullName: 'Jane Client',
            email: 'jane@example.com',
          },
          messageType: {
            id: 1,
            name: 'text',
          },
        },
      ],
    });

    expect(messagesRepository.find.mock.calls[0]).toEqual([
      {
        where: {
          tenantId: 12,
          conversationId: 44,
        },
        relations: {
          senderUser: true,
          messageType: true,
        },
        order: {
          sentAt: 'ASC',
        },
      },
    ]);
  });

  it('sends a text message using the authenticated user as sender', async () => {
    conversationsRepository.findOne.mockResolvedValue(buildConversation());
    messageTypesRepository.findOne.mockResolvedValue({
      id: 1,
      name: 'text',
    } as MessageType);
    messagesRepository.create.mockReturnValue({
      tenantId: 12,
      conversationId: 44,
      senderUserId: 31,
      messageTypeId: 1,
      content: 'Hello provider',
    } as Message);
    messagesRepository.save.mockResolvedValue({
      id: 71,
      tenantId: 12,
      conversationId: 44,
      senderUserId: 31,
      messageTypeId: 1,
      content: 'Hello provider',
    } as Message);
    messagesRepository.findOneOrFail.mockResolvedValue(
      buildMessage({
        id: 71,
        content: 'Hello provider',
      }),
    );

    const result = await service.sendMessage(
      44,
      { content: '  Hello provider  ' },
      clientUser,
    );

    expect(result.message).toEqual(
      expect.objectContaining({
        id: 71,
        conversationId: 44,
        senderUserId: 31,
        content: 'Hello provider',
      }) as Message,
    );

    expect(messagesRepository.create.mock.calls[0]).toEqual([
      {
        tenantId: 12,
        conversationId: 44,
        senderUserId: 31,
        messageTypeId: 1,
        content: 'Hello provider',
      },
    ]);
  });

  it('rejects blank text messages after trimming content', async () => {
    conversationsRepository.findOne.mockResolvedValue(buildConversation());
    messageTypesRepository.findOne.mockResolvedValue({
      id: 1,
      name: 'text',
    } as MessageType);

    await expect(
      service.sendMessage(44, { content: '   ' }, clientUser),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(messagesRepository.save.mock.calls).toHaveLength(0);
  });

  it('rejects sending messages when the user is not a participant', async () => {
    conversationsRepository.findOne.mockResolvedValue(
      buildConversation({
        clientUserId: 99,
      }),
    );

    await expect(
      service.sendMessage(44, { content: 'No access' }, clientUser),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

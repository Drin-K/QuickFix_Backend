import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import {
  Conversation,
  Message,
  MessageType,
  Provider,
  Service,
  User,
} from '../shared/entities';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Conversation,
      Message,
      MessageType,
      Provider,
      Service,
      User,
    ]),
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}

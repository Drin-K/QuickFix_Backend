import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Conversation } from './conversation.entity';
import { MessageType } from './message-type.entity';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

@Entity({ name: 'messages' })
@Unique('messages_id_tenant_uniq', ['id', 'tenantId'])
export class Message {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ name: 'tenant_id', type: 'int' })
  tenantId!: number;

  @Column({ name: 'conversation_id', type: 'int' })
  conversationId!: number;

  @Column({ name: 'sender_user_id', type: 'int' })
  senderUserId!: number;

  @Column({ name: 'message_type_id', type: 'int' })
  messageTypeId!: number;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn({ name: 'sent_at', type: 'timestamp' })
  sentAt!: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'conversation_id', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  conversation!: Conversation;

  @ManyToOne(() => User, (user) => user.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sender_user_id' })
  senderUser!: User;

  @ManyToOne(() => MessageType, (messageType) => messageType.messages, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'message_type_id' })
  messageType!: MessageType;
}

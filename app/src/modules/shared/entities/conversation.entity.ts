import { CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, Column } from 'typeorm';
import { Message } from './message.entity';
import { Provider } from './provider.entity';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

@Entity({ name: 'conversations' })
@Unique('conversations_id_tenant_uniq', ['id', 'tenantId'])
@Unique('conversations_unique_pair', ['tenantId', 'clientUserId', 'providerId'])
export class Conversation {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ name: 'tenant_id', type: 'int' })
  tenantId!: number;

  @Column({ name: 'client_user_id', type: 'int' })
  clientUserId!: number;

  @Column({ name: 'provider_id', type: 'int' })
  providerId!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.conversations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @ManyToOne(() => User, (user) => user.conversations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_user_id' })
  clientUser!: User;

  @ManyToOne(() => Provider, (provider) => provider.conversations, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'provider_id', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  provider!: Provider;

  @OneToMany(() => Message, (message) => message.conversation)
  messages!: Message[];
}

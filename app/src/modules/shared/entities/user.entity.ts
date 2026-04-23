import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { Conversation } from './conversation.entity';
import { Favorite } from './favorite.entity';
import { Message } from './message.entity';
import { Provider } from './provider.entity';
import { Review } from './review.entity';
import { Role } from './role.entity';
import { Tenant } from './tenant.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ name: 'role_id', type: 'int' })
  roleId!: number;

  @Column({ name: 'full_name', type: 'varchar', length: 255 })
  fullName!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => Role, (role) => role.users, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @OneToOne(() => Provider, (provider) => provider.ownerUser)
  provider!: Provider | null;

  @OneToOne(() => Tenant, (tenant) => tenant.ownerUser)
  ownedTenant!: Tenant | null;

  @OneToMany(() => Booking, (booking) => booking.clientUser)
  bookings!: Booking[];

  @OneToMany(() => Review, (review) => review.clientUser)
  reviews!: Review[];

  @OneToMany(() => Favorite, (favorite) => favorite.clientUser)
  favorites!: Favorite[];

  @OneToMany(() => Conversation, (conversation) => conversation.clientUser)
  conversations!: Conversation[];

  @OneToMany(() => Message, (message) => message.senderUser)
  messages!: Message[];
}

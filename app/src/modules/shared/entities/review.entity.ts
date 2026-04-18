import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Booking } from './booking.entity';
import { Provider } from './provider.entity';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

@Entity({ name: 'reviews' })
@Unique('reviews_id_tenant_uniq', ['id', 'tenantId'])
@Check(`"rating" BETWEEN 1 AND 5`)
export class Review {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ name: 'tenant_id', type: 'int' })
  tenantId!: number;

  @Column({ name: 'booking_id', type: 'int', unique: true })
  bookingId!: number;

  @Column({ name: 'client_user_id', type: 'int' })
  clientUserId!: number;

  @Column({ name: 'provider_id', type: 'int' })
  providerId!: number;

  @Column({ type: 'int' })
  rating!: number;

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @OneToOne(() => Booking, (booking) => booking.review, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'booking_id', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  booking!: Booking;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_user_id' })
  clientUser!: User;

  @ManyToOne(() => Provider, (provider) => provider.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'provider_id', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  provider!: Provider;
}

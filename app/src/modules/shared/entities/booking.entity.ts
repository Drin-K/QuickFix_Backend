import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { BookingStatus } from './booking-status.entity';
import { BookingStatusHistory } from './booking-status-history.entity';
import { Provider } from './provider.entity';
import { Review } from './review.entity';
import { Service } from './service.entity';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

@Entity({ name: 'bookings' })
@Unique('bookings_id_tenant_uniq', ['id', 'tenantId'])
export class Booking {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ name: 'tenant_id', type: 'int' })
  tenantId!: number;

  @Column({ name: 'client_user_id', type: 'int' })
  clientUserId!: number;

  @Column({ name: 'provider_id', type: 'int' })
  providerId!: number;

  @Column({ name: 'service_id', type: 'int' })
  serviceId!: number;

  @Column({ name: 'status_id', type: 'int' })
  statusId!: number;

  @Column({ name: 'booking_date', type: 'timestamp' })
  bookingDate!: Date;

  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalPrice!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_user_id' })
  clientUser!: User;

  @ManyToOne(() => Provider, (provider) => provider.bookings, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'provider_id', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  provider!: Provider;

  @ManyToOne(() => Service, (service) => service.bookings, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'service_id', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  service!: Service;

  @ManyToOne(() => BookingStatus, (status) => status.bookings, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'status_id' })
  status!: BookingStatus;

  @OneToMany(() => BookingStatusHistory, (history) => history.booking)
  statusHistoryEntries!: BookingStatusHistory[];

  @OneToOne(() => Review, (review) => review.booking)
  review!: Review | null;
}

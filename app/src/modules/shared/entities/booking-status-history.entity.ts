import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Booking } from './booking.entity';
import { BookingStatus } from './booking-status.entity';
import { Tenant } from './tenant.entity';

@Entity({ name: 'booking_status_history' })
@Unique('booking_status_history_id_tenant_uniq', ['id', 'tenantId'])
export class BookingStatusHistory {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ name: 'tenant_id', type: 'int' })
  tenantId!: number;

  @Column({ name: 'booking_id', type: 'int' })
  bookingId!: number;

  @Column({ name: 'old_status_id', type: 'int', nullable: true })
  oldStatusId!: number | null;

  @Column({ name: 'new_status_id', type: 'int' })
  newStatusId!: number;

  @CreateDateColumn({ name: 'changed_at', type: 'timestamp' })
  changedAt!: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.bookingStatusHistoryEntries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @ManyToOne(() => Booking, (booking) => booking.statusHistoryEntries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'booking_id', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  booking!: Booking;

  @ManyToOne(() => BookingStatus, (status) => status.oldStatusHistoryEntries, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'old_status_id' })
  oldStatus!: BookingStatus | null;

  @ManyToOne(() => BookingStatus, (status) => status.newStatusHistoryEntries, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'new_status_id' })
  newStatus!: BookingStatus;
}

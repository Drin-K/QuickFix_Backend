import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Booking } from './booking.entity';
import { BookingStatusHistory } from './booking-status-history.entity';

@Entity({ name: 'booking_statuses' })
export class BookingStatus {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name!: string;

  @OneToMany(() => Booking, (booking) => booking.status)
  bookings!: Booking[];

  @OneToMany(() => BookingStatusHistory, (history) => history.oldStatus)
  oldStatusHistoryEntries!: BookingStatusHistory[];

  @OneToMany(() => BookingStatusHistory, (history) => history.newStatus)
  newStatusHistoryEntries!: BookingStatusHistory[];
}

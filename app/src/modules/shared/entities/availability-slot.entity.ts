import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Provider } from './provider.entity';
import { Tenant } from './tenant.entity';

@Entity({ name: 'availability_slots' })
@Unique('availability_slots_id_tenant_uniq', ['id', 'tenantId'])
export class AvailabilitySlot {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ name: 'tenant_id', type: 'int' })
  tenantId!: number;

  @Column({ name: 'provider_id', type: 'int' })
  providerId!: number;

  @Column({ name: 'start_time', type: 'timestamp' })
  startTime!: Date;

  @Column({ name: 'end_time', type: 'timestamp' })
  endTime!: Date;

  @Column({ name: 'is_booked', type: 'boolean', default: false })
  isBooked!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.availabilitySlots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @ManyToOne(() => Provider, (provider) => provider.availabilitySlots, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'provider_id', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  provider!: Provider;
}

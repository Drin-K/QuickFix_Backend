import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { Category } from './category.entity';
import { Provider } from './provider.entity';
import { ServiceImage } from './service-image.entity';
import { ServiceTagMap } from './service-tag-map.entity';
import { Tenant } from './tenant.entity';

@Entity({ name: 'services' })
@Unique('services_id_tenant_uniq', ['id', 'tenantId'])
export class Service {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ name: 'tenant_id', type: 'int' })
  tenantId!: number;

  @Column({ name: 'provider_id', type: 'int' })
  providerId!: number;

  @Column({ name: 'category_id', type: 'int' })
  categoryId!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    name: 'base_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  basePrice!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @ManyToOne(() => Provider, (provider) => provider.services, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'provider_id', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  provider!: Provider;

  @ManyToOne(() => Category, (category) => category.services, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @OneToMany(() => ServiceTagMap, (serviceTagMap) => serviceTagMap.service)
  serviceTagMaps!: ServiceTagMap[];

  @OneToMany(() => ServiceImage, (serviceImage) => serviceImage.service)
  images!: ServiceImage[];

  @OneToMany(() => Booking, (booking) => booking.service)
  bookings!: Booking[];
}

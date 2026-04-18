import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Service } from './service.entity';
import { Tenant } from './tenant.entity';

@Entity({ name: 'service_images' })
@Unique('service_images_id_tenant_uniq', ['id', 'tenantId'])
export class ServiceImage {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ name: 'tenant_id', type: 'int' })
  tenantId!: number;

  @Column({ name: 'service_id', type: 'int' })
  serviceId!: number;

  @Column({ name: 'image_url', type: 'text' })
  imageUrl!: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @ManyToOne(() => Tenant, (tenant) => tenant.serviceImages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @ManyToOne(() => Service, (service) => service.images, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'service_id', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  service!: Service;
}

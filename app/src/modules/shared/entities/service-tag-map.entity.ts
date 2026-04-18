import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Service } from './service.entity';
import { ServiceTag } from './service-tag.entity';
import { Tenant } from './tenant.entity';

@Entity({ name: 'service_tag_map' })
@Unique('service_tag_map_id_tenant_uniq', ['id', 'tenantId'])
@Unique('service_tag_map_service_tag_uniq', ['tenantId', 'serviceId', 'tagId'])
export class ServiceTagMap {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ name: 'tenant_id', type: 'int' })
  tenantId!: number;

  @Column({ name: 'service_id', type: 'int' })
  serviceId!: number;

  @Column({ name: 'tag_id', type: 'int' })
  tagId!: number;

  @ManyToOne(() => Tenant, (tenant) => tenant.serviceTagMaps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @ManyToOne(() => Service, (service) => service.serviceTagMaps, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'service_id', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  service!: Service;

  @ManyToOne(() => ServiceTag, (tag) => tag.serviceTagMaps, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tag_id' })
  tag!: ServiceTag;
}

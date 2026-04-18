import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Provider } from './provider.entity';
import { Tenant } from './tenant.entity';

@Entity({ name: 'provider_company_details' })
@Unique('provider_company_details_id_tenant_uniq', ['id', 'tenantId'])
export class ProviderCompanyDetail {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ name: 'tenant_id', type: 'int' })
  tenantId!: number;

  @Column({ name: 'provider_id', type: 'int', unique: true })
  providerId!: number;

  @Column({ name: 'business_name', type: 'varchar', length: 255 })
  businessName!: string;

  @Column({
    name: 'business_number',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  businessNumber!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.providerCompanyDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @OneToOne(() => Provider, (provider) => provider.companyDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'provider_id', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  provider!: Provider;
}

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

@Entity({ name: 'provider_individual_details' })
@Unique('provider_individual_details_id_tenant_uniq', ['id', 'tenantId'])
export class ProviderIndividualDetail {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ name: 'tenant_id', type: 'int' })
  tenantId!: number;

  @Column({ name: 'provider_id', type: 'int', unique: true })
  providerId!: number;

  @Column({ name: 'profession_title', type: 'varchar', length: 255 })
  professionTitle!: string;

  @Column({ name: 'years_of_experience', type: 'int', nullable: true })
  yearsOfExperience!: number | null;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.providerIndividualDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @OneToOne(() => Provider, (provider) => provider.individualDetails, {
    onDelete: 'CASCADE',
  })
  @JoinColumn([
    { name: 'provider_id', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  provider!: Provider;
}

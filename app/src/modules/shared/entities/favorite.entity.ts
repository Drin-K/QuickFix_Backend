import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Provider } from './provider.entity';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

@Entity({ name: 'favorites' })
@Unique('favorites_id_tenant_uniq', ['id', 'tenantId'])
@Unique('favorites_client_provider_uniq', ['clientUserId', 'tenantId', 'providerId'])
export class Favorite {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ name: 'tenant_id', type: 'int' })
  tenantId!: number;

  @Column({ name: 'client_user_id', type: 'int' })
  clientUserId!: number;

  @Column({ name: 'provider_id', type: 'int' })
  providerId!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @ManyToOne(() => User, (user) => user.favorites, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_user_id' })
  clientUser!: User;

  @ManyToOne(() => Provider, (provider) => provider.favorites, { onDelete: 'CASCADE' })
  @JoinColumn([
    { name: 'provider_id', referencedColumnName: 'id' },
    { name: 'tenant_id', referencedColumnName: 'tenantId' },
  ])
  provider!: Provider;
}

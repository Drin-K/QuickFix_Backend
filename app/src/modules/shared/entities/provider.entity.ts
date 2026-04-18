import {
  Check,
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
import { AvailabilitySlot } from './availability-slot.entity';
import { Booking } from './booking.entity';
import { City } from './city.entity';
import { Conversation } from './conversation.entity';
import { Favorite } from './favorite.entity';
import { ProviderCompanyDetail } from './provider-company-detail.entity';
import { ProviderDocument } from './provider-document.entity';
import { ProviderIndividualDetail } from './provider-individual-detail.entity';
import { Review } from './review.entity';
import { Service } from './service.entity';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

@Entity({ name: 'providers' })
@Unique('providers_id_tenant_uniq', ['id', 'tenantId'])
@Check(`"type" IN ('company', 'individual')`)
export class Provider {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ name: 'tenant_id', type: 'int' })
  tenantId!: number;

  @Column({ name: 'owner_user_id', type: 'int', unique: true })
  ownerUserId!: number;

  @Column({ type: 'varchar', length: 20 })
  type!: 'company' | 'individual';

  @Column({ name: 'display_name', type: 'varchar', length: 255 })
  displayName!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'city_id', type: 'int', nullable: true })
  cityId!: number | null;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, nullable: true })
  averageRating!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.providers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @OneToOne(() => User, (user) => user.provider, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_user_id' })
  ownerUser!: User;

  @ManyToOne(() => City, (city) => city.providers, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'city_id' })
  city!: City | null;

  @OneToOne(() => ProviderCompanyDetail, (detail) => detail.provider)
  companyDetails!: ProviderCompanyDetail | null;

  @OneToOne(() => ProviderIndividualDetail, (detail) => detail.provider)
  individualDetails!: ProviderIndividualDetail | null;

  @OneToMany(() => ProviderDocument, (document) => document.provider)
  documents!: ProviderDocument[];

  @OneToMany(() => Service, (service) => service.provider)
  services!: Service[];

  @OneToMany(() => AvailabilitySlot, (availabilitySlot) => availabilitySlot.provider)
  availabilitySlots!: AvailabilitySlot[];

  @OneToMany(() => Booking, (booking) => booking.provider)
  bookings!: Booking[];

  @OneToMany(() => Review, (review) => review.provider)
  reviews!: Review[];

  @OneToMany(() => Favorite, (favorite) => favorite.provider)
  favorites!: Favorite[];

  @OneToMany(() => Conversation, (conversation) => conversation.provider)
  conversations!: Conversation[];
}

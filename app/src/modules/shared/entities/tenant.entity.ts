import {
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { AvailabilitySlot } from './availability-slot.entity';
import { Booking } from './booking.entity';
import { BookingStatusHistory } from './booking-status-history.entity';
import { Conversation } from './conversation.entity';
import { Favorite } from './favorite.entity';
import { Message } from './message.entity';
import { Provider } from './provider.entity';
import { ProviderCompanyDetail } from './provider-company-detail.entity';
import { ProviderDocument } from './provider-document.entity';
import { ProviderIndividualDetail } from './provider-individual-detail.entity';
import { Review } from './review.entity';
import { Service } from './service.entity';
import { ServiceImage } from './service-image.entity';
import { ServiceTagMap } from './service-tag-map.entity';

@Entity({ name: 'tenants' })
export class Tenant {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  name!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @OneToMany(() => Provider, (provider) => provider.tenant)
  providers!: Provider[];

  @OneToMany(() => ProviderCompanyDetail, (detail) => detail.tenant)
  providerCompanyDetails!: ProviderCompanyDetail[];

  @OneToMany(() => ProviderIndividualDetail, (detail) => detail.tenant)
  providerIndividualDetails!: ProviderIndividualDetail[];

  @OneToMany(() => ProviderDocument, (document) => document.tenant)
  providerDocuments!: ProviderDocument[];

  @OneToMany(() => Service, (service) => service.tenant)
  services!: Service[];

  @OneToMany(() => ServiceTagMap, (serviceTagMap) => serviceTagMap.tenant)
  serviceTagMaps!: ServiceTagMap[];

  @OneToMany(() => ServiceImage, (serviceImage) => serviceImage.tenant)
  serviceImages!: ServiceImage[];

  @OneToMany(
    () => AvailabilitySlot,
    (availabilitySlot) => availabilitySlot.tenant,
  )
  availabilitySlots!: AvailabilitySlot[];

  @OneToMany(() => Booking, (booking) => booking.tenant)
  bookings!: Booking[];

  @OneToMany(() => BookingStatusHistory, (history) => history.tenant)
  bookingStatusHistoryEntries!: BookingStatusHistory[];

  @OneToMany(() => Review, (review) => review.tenant)
  reviews!: Review[];

  @OneToMany(() => Favorite, (favorite) => favorite.tenant)
  favorites!: Favorite[];

  @OneToMany(() => Conversation, (conversation) => conversation.tenant)
  conversations!: Conversation[];

  @OneToMany(() => Message, (message) => message.tenant)
  messages!: Message[];
}

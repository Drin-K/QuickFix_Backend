import { AvailabilitySlot } from './availability-slot.entity';
import { Booking } from './booking.entity';
import { BookingStatusHistory } from './booking-status-history.entity';
import { BookingStatus } from './booking-status.entity';
import { Category } from './category.entity';
import { City } from './city.entity';
import { Conversation } from './conversation.entity';
import { Favorite } from './favorite.entity';
import { Message } from './message.entity';
import { MessageType } from './message-type.entity';
import { ProviderCompanyDetail } from './provider-company-detail.entity';
import { ProviderDocument } from './provider-document.entity';
import { ProviderIndividualDetail } from './provider-individual-detail.entity';
import { Provider } from './provider.entity';
import { Review } from './review.entity';
import { Role } from './role.entity';
import { ServiceImage } from './service-image.entity';
import { ServiceTagMap } from './service-tag-map.entity';
import { ServiceTag } from './service-tag.entity';
import { Service } from './service.entity';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

export {
  AvailabilitySlot,
  Booking,
  BookingStatus,
  BookingStatusHistory,
  Category,
  City,
  Conversation,
  Favorite,
  Message,
  MessageType,
  Provider,
  ProviderCompanyDetail,
  ProviderDocument,
  ProviderIndividualDetail,
  Review,
  Role,
  Service,
  ServiceImage,
  ServiceTag,
  ServiceTagMap,
  Tenant,
  User,
};

export const entityClasses = [
  Role,
  User,
  Tenant,
  City,
  Category,
  ServiceTag,
  BookingStatus,
  MessageType,
  Provider,
  ProviderCompanyDetail,
  ProviderIndividualDetail,
  ProviderDocument,
  Service,
  ServiceTagMap,
  ServiceImage,
  AvailabilitySlot,
  Booking,
  BookingStatusHistory,
  Review,
  Favorite,
  Conversation,
  Message,
];

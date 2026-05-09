import { readFile } from 'fs/promises';
import { join } from 'path';
import { hash } from 'bcryptjs';
import dataSource from '../data-source';
import {
  AvailabilitySlot,
  BookingStatus,
  Category,
  City,
  MessageType,
  Provider,
  ProviderCompanyDetail,
  ProviderIndividualDetail,
  Role,
  Service,
  ServiceImage,
  ServiceTag,
  ServiceTagMap,
  Tenant,
  User,
} from '../../modules/shared/entities';

type CsvRow = Record<string, string>;

const seedsDir = join(__dirname, 'csv');

const normalize = (value: string): string => value.trim().toLowerCase();

const nullable = (value: string | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const boolValue = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  return ['true', '1', 'yes'].includes(normalize(value));
};

const intValue = (value: string | undefined): number | null => {
  if (value === undefined || value.trim() === '') {
    return null;
  }

  return Number.parseInt(value, 10);
};

const parseCsv = (content: string): CsvRow[] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const nextChar = content[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      field += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }

      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [headers, ...dataRows] = rows.filter((cells) =>
    cells.some((cell) => cell.trim() !== ''),
  );

  if (!headers) {
    return [];
  }

  return dataRows.map((cells) =>
    headers.reduce<CsvRow>((rowObject, header, index) => {
      rowObject[header.trim()] = cells[index]?.trim() ?? '';
      return rowObject;
    }, {}),
  );
};

const readCsv = async (fileName: string): Promise<CsvRow[]> => {
  const content = await readFile(join(seedsDir, fileName), 'utf8');
  return parseCsv(content);
};

const findRequired = async <T>(
  label: string,
  finder: () => Promise<T | null>,
): Promise<T> => {
  const value = await finder();

  if (!value) {
    throw new Error(`Missing seed dependency: ${label}`);
  }

  return value;
};

const seedLookupTables = async (): Promise<void> => {
  const rolesRepository = dataSource.getRepository(Role);
  const bookingStatusesRepository = dataSource.getRepository(BookingStatus);
  const messageTypesRepository = dataSource.getRepository(MessageType);

  for (const row of await readCsv('roles.csv')) {
    await rolesRepository.upsert({ name: row.name }, ['name']);
  }

  for (const row of await readCsv('booking_statuses.csv')) {
    await bookingStatusesRepository.upsert({ name: row.name }, ['name']);
  }

  for (const row of await readCsv('message_types.csv')) {
    await messageTypesRepository.upsert({ name: row.name }, ['name']);
  }
};

const seedUsers = async (): Promise<void> => {
  const usersRepository = dataSource.getRepository(User);
  const rolesRepository = dataSource.getRepository(Role);

  for (const row of await readCsv('users.csv')) {
    const role = await findRequired(`role ${row.roleName}`, () =>
      rolesRepository.findOne({ where: { name: row.roleName } }),
    );
    const email = normalize(row.email);
    const existingUser = await usersRepository.findOne({ where: { email } });
    const passwordHash = await hash(row.password || 'Password123!', 10);

    await usersRepository.save(
      usersRepository.create({
        id: existingUser?.id,
        roleId: role.id,
        fullName: row.fullName,
        email,
        passwordHash,
        phone: nullable(row.phone),
        isActive: boolValue(row.isActive, true),
      }),
    );
  }
};

const seedTenants = async (): Promise<void> => {
  const tenantsRepository = dataSource.getRepository(Tenant);

  for (const row of await readCsv('tenants.csv')) {
    const existingTenant = await tenantsRepository.findOne({
      where: { name: row.name },
    });

    await tenantsRepository.save(
      tenantsRepository.create({
        id: existingTenant?.id,
        name: row.name,
      }),
    );
  }
};

const seedCitiesAndCategories = async (): Promise<void> => {
  const citiesRepository = dataSource.getRepository(City);
  const categoriesRepository = dataSource.getRepository(Category);

  for (const row of await readCsv('cities.csv')) {
    await citiesRepository.upsert({ name: row.name }, ['name']);
  }

  for (const row of await readCsv('categories.csv')) {
    await categoriesRepository.upsert(
      {
        name: row.name,
        description: nullable(row.description),
      },
      ['name'],
    );
  }
};

const seedProviders = async (): Promise<void> => {
  const providersRepository = dataSource.getRepository(Provider);
  const tenantsRepository = dataSource.getRepository(Tenant);
  const usersRepository = dataSource.getRepository(User);
  const citiesRepository = dataSource.getRepository(City);

  for (const row of await readCsv('providers.csv')) {
    const ownerUser = await findRequired(`provider owner ${row.ownerEmail}`, () =>
      usersRepository.findOne({ where: { email: normalize(row.ownerEmail) } }),
    );
    const tenant = await findRequired(`tenant ${row.tenantName}`, () =>
      tenantsRepository.findOne({ where: { name: row.tenantName } }),
    );
    const city = await findRequired(`city ${row.cityName}`, () =>
      citiesRepository.findOne({ where: { name: row.cityName } }),
    );
    const existingProvider = await providersRepository.findOne({
      where: { ownerUserId: ownerUser.id },
    });

    await providersRepository.save(
      providersRepository.create({
        id: existingProvider?.id,
        tenantId: tenant.id,
        ownerUserId: ownerUser.id,
        type: row.type as 'company' | 'individual',
        displayName: row.displayName,
        description: nullable(row.description),
        cityId: city.id,
        address: nullable(row.address),
        isVerified: boolValue(row.isVerified),
        averageRating: nullable(row.averageRating),
      }),
    );
  }
};

const seedProviderDetails = async (): Promise<void> => {
  const providersRepository = dataSource.getRepository(Provider);
  const usersRepository = dataSource.getRepository(User);
  const individualDetailsRepository = dataSource.getRepository(
    ProviderIndividualDetail,
  );
  const companyDetailsRepository = dataSource.getRepository(
    ProviderCompanyDetail,
  );

  for (const row of await readCsv('provider_individual_details.csv')) {
    const ownerUser = await findRequired(
      `individual provider owner ${row.providerOwnerEmail}`,
      () =>
        usersRepository.findOne({
          where: { email: normalize(row.providerOwnerEmail) },
        }),
    );
    const provider = await findRequired(`provider ${row.providerOwnerEmail}`, () =>
      providersRepository.findOne({ where: { ownerUserId: ownerUser.id } }),
    );
    const existingDetails = await individualDetailsRepository.findOne({
      where: { tenantId: provider.tenantId, providerId: provider.id },
    });

    await individualDetailsRepository.save(
      individualDetailsRepository.create({
        id: existingDetails?.id,
        tenantId: provider.tenantId,
        providerId: provider.id,
        professionTitle: row.professionTitle,
        yearsOfExperience: intValue(row.yearsOfExperience),
        bio: nullable(row.bio),
      }),
    );
  }

  for (const row of await readCsv('provider_company_details.csv')) {
    const ownerUser = await findRequired(
      `company provider owner ${row.providerOwnerEmail}`,
      () =>
        usersRepository.findOne({
          where: { email: normalize(row.providerOwnerEmail) },
        }),
    );
    const provider = await findRequired(`provider ${row.providerOwnerEmail}`, () =>
      providersRepository.findOne({ where: { ownerUserId: ownerUser.id } }),
    );
    const existingDetails = await companyDetailsRepository.findOne({
      where: { tenantId: provider.tenantId, providerId: provider.id },
    });

    await companyDetailsRepository.save(
      companyDetailsRepository.create({
        id: existingDetails?.id,
        tenantId: provider.tenantId,
        providerId: provider.id,
        businessName: row.businessName,
        businessNumber: nullable(row.businessNumber),
        website: nullable(row.website),
      }),
    );
  }
};

const seedServices = async (): Promise<void> => {
  const servicesRepository = dataSource.getRepository(Service);
  const providersRepository = dataSource.getRepository(Provider);
  const usersRepository = dataSource.getRepository(User);
  const categoriesRepository = dataSource.getRepository(Category);

  for (const row of await readCsv('services.csv')) {
    const ownerUser = await findRequired(
      `service provider owner ${row.providerOwnerEmail}`,
      () =>
        usersRepository.findOne({
          where: { email: normalize(row.providerOwnerEmail) },
        }),
    );
    const provider = await findRequired(`provider ${row.providerOwnerEmail}`, () =>
      providersRepository.findOne({ where: { ownerUserId: ownerUser.id } }),
    );
    const category = await findRequired(`category ${row.categoryName}`, () =>
      categoriesRepository.findOne({ where: { name: row.categoryName } }),
    );
    const existingService = await servicesRepository.findOne({
      where: {
        tenantId: provider.tenantId,
        providerId: provider.id,
        title: row.title,
      },
    });

    await servicesRepository.save(
      servicesRepository.create({
        id: existingService?.id,
        tenantId: provider.tenantId,
        providerId: provider.id,
        categoryId: category.id,
        title: row.title,
        description: nullable(row.description),
        basePrice: row.basePrice || '0.00',
        isActive: boolValue(row.isActive, true),
      }),
    );
  }
};

const findService = async (
  providerOwnerEmail: string,
  title: string,
): Promise<Service> => {
  const usersRepository = dataSource.getRepository(User);
  const providersRepository = dataSource.getRepository(Provider);
  const servicesRepository = dataSource.getRepository(Service);
  const ownerUser = await findRequired(`provider owner ${providerOwnerEmail}`, () =>
    usersRepository.findOne({ where: { email: normalize(providerOwnerEmail) } }),
  );
  const provider = await findRequired(`provider ${providerOwnerEmail}`, () =>
    providersRepository.findOne({ where: { ownerUserId: ownerUser.id } }),
  );

  return findRequired(`service ${providerOwnerEmail} / ${title}`, () =>
    servicesRepository.findOne({
      where: {
        tenantId: provider.tenantId,
        providerId: provider.id,
        title,
      },
    }),
  );
};

const seedTagsImagesAndAvailability = async (): Promise<void> => {
  const tagsRepository = dataSource.getRepository(ServiceTag);
  const tagMapsRepository = dataSource.getRepository(ServiceTagMap);
  const imagesRepository = dataSource.getRepository(ServiceImage);
  const availabilityRepository = dataSource.getRepository(AvailabilitySlot);

  for (const row of await readCsv('service_tags.csv')) {
    await tagsRepository.upsert({ name: row.name }, ['name']);
  }

  for (const row of await readCsv('service_tag_map.csv')) {
    const service = await findService(row.providerOwnerEmail, row.serviceTitle);
    const tag = await findRequired(`tag ${row.tagName}`, () =>
      tagsRepository.findOne({ where: { name: row.tagName } }),
    );
    const existingMap = await tagMapsRepository.findOne({
      where: {
        tenantId: service.tenantId,
        serviceId: service.id,
        tagId: tag.id,
      },
    });

    if (!existingMap) {
      await tagMapsRepository.save(
        tagMapsRepository.create({
          tenantId: service.tenantId,
          serviceId: service.id,
          tagId: tag.id,
        }),
      );
    }
  }

  for (const row of await readCsv('service_images.csv')) {
    const service = await findService(row.providerOwnerEmail, row.serviceTitle);
    const existingImage = await imagesRepository.findOne({
      where: {
        tenantId: service.tenantId,
        serviceId: service.id,
        imageUrl: row.imageUrl,
      },
    });

    await imagesRepository.save(
      imagesRepository.create({
        id: existingImage?.id,
        tenantId: service.tenantId,
        serviceId: service.id,
        imageUrl: row.imageUrl,
        sortOrder: intValue(row.sortOrder) ?? 0,
      }),
    );
  }

  for (const row of await readCsv('availability_slots.csv')) {
    const service = await findService(row.providerOwnerEmail, row.serviceTitle);
    const startTime = new Date(row.startTime);
    const existingSlot = await availabilityRepository.findOne({
      where: {
        tenantId: service.tenantId,
        providerId: service.providerId,
        startTime,
      },
    });

    await availabilityRepository.save(
      availabilityRepository.create({
        id: existingSlot?.id,
        tenantId: service.tenantId,
        providerId: service.providerId,
        startTime,
        endTime: new Date(row.endTime),
        isBooked: boolValue(row.isBooked),
      }),
    );
  }
};

const run = async (): Promise<void> => {
  await dataSource.initialize();

  try {
    await seedLookupTables();
    await seedUsers();
    await seedTenants();
    await seedCitiesAndCategories();
    await seedProviders();
    await seedProviderDetails();
    await seedServices();
    await seedTagsImagesAndAvailability();

    console.log('Seed completed successfully.');
  } finally {
    await dataSource.destroy();
  }
};

run().catch((error: unknown) => {
  console.error('Seed failed.');
  console.error(error);
  process.exit(1);
});

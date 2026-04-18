import 'dotenv/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { entityClasses } from '../modules/shared/entities';
import { DataSourceOptions } from 'typeorm';

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsedValue = Number(value);

  return Number.isNaN(parsedValue) ? fallback : parsedValue;
};

const parseBoolean = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) {
    return fallback;
  }

  return value === 'true';
};

const sslEnabled = parseBoolean(process.env.DB_SSL);

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST ?? 'localhost',
  port: parseNumber(process.env.DB_PORT, 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'quickfix',
  entities: entityClasses,
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  synchronize: false,
  logging: parseBoolean(process.env.DB_LOGGING),
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
};

export const getTypeOrmModuleOptions = (): TypeOrmModuleOptions => ({
  ...dataSourceOptions,
  autoLoadEntities: true,
  retryAttempts: 3,
  retryDelay: 1000,
});

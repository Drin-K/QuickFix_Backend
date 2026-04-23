import { QueryRunner } from 'typeorm';
import { InitSharedEntities1776470338788 } from './migrations/1776470338788-InitSharedEntities';

describe('InitSharedEntities1776470338788', () => {
  it('creates tenant ownership columns and owner foreign key', async () => {
    const executedQueries: string[] = [];
    const queryRunner = {
      query: jest.fn((sql: string) => {
        executedQueries.push(sql);
      }),
    } as unknown as QueryRunner;

    const migration = new InitSharedEntities1776470338788();

    await migration.up(queryRunner);

    expect(
      executedQueries.some(
        (sql) =>
          sql.includes('CREATE TABLE "tenants"') &&
          sql.includes('"slug" character varying(255) NOT NULL') &&
          sql.includes('"owner_user_id" integer NOT NULL') &&
          sql.includes('"is_active" boolean NOT NULL DEFAULT true') &&
          sql.includes('"updated_at" TIMESTAMP NOT NULL DEFAULT now()'),
      ),
    ).toBe(true);

    expect(
      executedQueries.some(
        (sql) =>
          sql.includes('ALTER TABLE "tenants" ADD CONSTRAINT') &&
          sql.includes(
            'FOREIGN KEY ("owner_user_id") REFERENCES "users"("id")',
          ),
      ),
    ).toBe(true);
  });

  it('creates company-scoped user and role design in the initial schema', async () => {
    const executedQueries: string[] = [];
    const queryRunner = {
      query: jest.fn((sql: string) => {
        executedQueries.push(sql);
      }),
    } as unknown as QueryRunner;

    const migration = new InitSharedEntities1776470338788();

    await migration.up(queryRunner);

    expect(
      executedQueries.some(
        (sql) =>
          sql.includes('CREATE TABLE "roles"') &&
          sql.includes('"scope" character varying(20) NOT NULL DEFAULT \'platform\''),
      ),
    ).toBe(true);

    expect(
      executedQueries.some(
        (sql) =>
          sql.includes('CREATE TABLE "users"') &&
          sql.includes('"tenant_id" integer') &&
          sql.includes('"role_id" integer NOT NULL'),
      ),
    ).toBe(true);

    expect(
      executedQueries.some(
        (sql) =>
          sql.includes('ALTER TABLE "users" ADD CONSTRAINT') &&
          sql.includes(
            'FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL',
          ),
      ),
    ).toBe(true);
  });

  it('drops the tenant owner foreign key on rollback', async () => {
    const executedQueries: string[] = [];
    const queryRunner = {
      query: jest.fn((sql: string) => {
        executedQueries.push(sql);
      }),
    } as unknown as QueryRunner;

    const migration = new InitSharedEntities1776470338788();

    await migration.down(queryRunner);

    expect(
      executedQueries.some(
        (sql) =>
          sql.includes('ALTER TABLE "tenants" DROP CONSTRAINT') &&
          sql.includes('FK_3fe51eb17d6b78b00e6cf267873'),
      ),
    ).toBe(true);

    expect(
      executedQueries.some(
        (sql) =>
          sql.includes('ALTER TABLE "users" DROP CONSTRAINT') &&
          sql.includes('FK_3f6b320e277f52f181ad44e87bb'),
      ),
    ).toBe(true);
  });
});

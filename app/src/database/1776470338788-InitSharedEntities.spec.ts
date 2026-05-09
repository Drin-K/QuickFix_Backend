import { QueryRunner } from 'typeorm';
import { InitSharedEntities1776470338788 } from './migrations/1776470338788-InitSharedEntities';

describe('InitSharedEntities1776470338788', () => {
  it('creates tenants according to the final shared schema', async () => {
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
          sql.includes('"name" character varying(255) NOT NULL') &&
          sql.includes('"created_at" TIMESTAMP NOT NULL DEFAULT now()') &&
          sql.includes('UNIQUE ("name")'),
      ),
    ).toBe(true);

    expect(
      executedQueries.some(
        (sql) =>
          sql.includes('ALTER TABLE "tenants" ADD CONSTRAINT') &&
          sql.includes('owner_user_id'),
      ),
    ).toBe(false);
  });
});

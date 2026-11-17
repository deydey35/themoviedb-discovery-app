import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import {
  findCountryByCode,
  listCountries,
  type Country,
  deleteUnusedCountries,
  upsertCountries,
} from './country-repository';
import { initializeSchema } from './schema';

function createDatabase(): DatabaseSync {
  const database = new DatabaseSync(':memory:');
  initializeSchema(database);
  return database;
}

describe('country repository', () => {
  it('finds an existing country and returns undefined for an unknown code', () => {
    const database = createDatabase();
    database.exec("INSERT INTO countries (code, name) VALUES ('FR', 'France')");

    expect(findCountryByCode(database, 'FR')).toEqual({
      code: 'FR',
      name: 'France',
    });
    expect(findCountryByCode(database, 'US')).toBeUndefined();
    database.close();
  });

  it('returns an empty list and lists countries in ascending code order', () => {
    const database = createDatabase();

    expect(listCountries(database)).toEqual([]);
    upsertCountries(database, [
      { code: 'US', name: 'United States' },
      { code: 'FR', name: 'France' },
    ]);

    expect(listCountries(database)).toEqual([
      { code: 'FR', name: 'France' },
      { code: 'US', name: 'United States' },
    ]);
    database.close();
  });

  it('inserts and updates countries without creating duplicates', () => {
    const database = createDatabase();
    upsertCountries(database, [{ code: 'FR', name: 'France' }]);

    upsertCountries(database, [{ code: 'FR', name: 'French Republic' }]);

    expect(listCountries(database)).toEqual([
      { code: 'FR', name: 'French Republic' },
    ]);
    database.close();
  });

  it('accepts arrays and other iterables, keeps the last duplicate, and supports empty input', () => {
    const database = createDatabase();
    const iterable = new Set<Country>([
      { code: 'FR', name: 'France' },
      { code: 'US', name: 'United States' },
    ]);

    upsertCountries(database, iterable);
    upsertCountries(
      database,
      (function* () {
        yield { code: 'FR', name: 'French Republic' };
        yield { code: 'FR', name: 'République française' };
      })(),
    );
    upsertCountries(database, []);

    expect(listCountries(database)).toEqual([
      { code: 'FR', name: 'République française' },
      { code: 'US', name: 'United States' },
    ]);
    database.close();
  });

  it('deletes only countries without a movie association', () => {
    const database = createDatabase();
    upsertCountries(database, [
      { code: 'FR', name: 'France' },
      { code: 'US', name: 'United States' },
    ]);
    database.exec(`
      INSERT INTO films (id, title, original_title) VALUES (1, 'Film', 'Movie');
      INSERT INTO production_countries (movie_id, country_code) VALUES (1, 'FR');
    `);

    expect(deleteUnusedCountries(database)).toBe(1);
    expect(listCountries(database)).toEqual([{ code: 'FR', name: 'France' }]);
    database.close();
  });

  it('rejects malformed rows and rolls back cleanup errors', () => {
    const database = createDatabase();
    database.exec(`
      DROP TABLE production_countries;
      DROP TABLE countries;
      CREATE TABLE countries (code INTEGER, name INTEGER);
      INSERT INTO countries (code, name) VALUES (1, 10);
    `);

    expect(() => listCountries(database)).toThrow('Invalid country row');
    expect(() => deleteUnusedCountries(database)).toThrow();
    expect(() => database.exec('ROLLBACK')).toThrow();
    database.close();
  });
});

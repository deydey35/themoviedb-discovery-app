import { DatabaseSync } from 'node:sqlite';

export interface Country {
  code: string;
  name: string;
}

function toCountry(row: Record<string, unknown>): Country {
  if (typeof row.code !== 'string' || typeof row.name !== 'string') {
    throw new TypeError('Invalid country row');
  }

  return { code: row.code, name: row.name };
}

export function findCountryByCode(
  database: DatabaseSync,
  code: string,
): Country | undefined {
  const row = database
    .prepare('SELECT code, name FROM production_countries WHERE code = ?')
    .get(code);
  return row === undefined ? undefined : toCountry(row);
}

export function listCountries(database: DatabaseSync): Country[] {
  const rows = database
    .prepare('SELECT code, name FROM production_countries ORDER BY code ASC')
    .all();
  return rows.map(toCountry);
}

export function upsertCountries(
  database: DatabaseSync,
  countries: Iterable<Country>,
): void {
  database.exec('BEGIN');
  try {
    const statement = database.prepare(`
      INSERT INTO production_countries (code, name)
      VALUES (?, ?)
      ON CONFLICT (code) DO UPDATE SET name = excluded.name
    `);

    for (const country of countries) {
      statement.run(country.code, country.name);
    }

    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

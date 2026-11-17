import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { initializeSchema, schemaSql } from './schema';

describe('SQLite schema', () => {
  it('creates the tables, generated release year, and unique associations', () => {
    const database = new DatabaseSync(':memory:');

    initializeSchema(database);
    database.exec(`
      INSERT INTO films (id, title, original_title, release_date)
      VALUES (1, 'Film', 'Movie', '2024-01-02');
      INSERT INTO genres (id, name) VALUES (10, 'Comedy');
      INSERT INTO movie_genres (movie_id, genre_id) VALUES (1, 10);
    `);

    expect(
      database
        .prepare('SELECT name FROM sqlite_master WHERE type = ?')
        .all('table'),
    ).toEqual(
      expect.arrayContaining([
        { name: 'films' },
        { name: 'movie_observations' },
        { name: 'genres' },
        { name: 'movie_genres' },
        { name: 'countries' },
        { name: 'production_countries' },
      ]),
    );
    expect(database.prepare('SELECT release_year FROM films').get()).toEqual({
      release_year: 2024,
    });
    expect(() =>
      database.exec(
        'INSERT INTO movie_genres (movie_id, genre_id) VALUES (1, 10)',
      ),
    ).toThrow();
  });

  it('migrates legacy country tables without losing countries or associations', () => {
    const database = new DatabaseSync(':memory:');
    database.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE films (id INTEGER PRIMARY KEY);
      CREATE TABLE production_countries (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );
      CREATE TABLE movie_production_countries (
        movie_id INTEGER NOT NULL REFERENCES films (id) ON DELETE CASCADE,
        country_code TEXT NOT NULL REFERENCES production_countries (code) ON DELETE RESTRICT,
        PRIMARY KEY (movie_id, country_code)
      );
      INSERT INTO films (id) VALUES (1);
      INSERT INTO production_countries (code, name) VALUES ('FR', 'France');
      INSERT INTO movie_production_countries (movie_id, country_code)
      VALUES (1, 'FR');
    `);

    initializeSchema(database);

    expect(database.prepare('SELECT code, name FROM countries').all()).toEqual([
      { code: 'FR', name: 'France' },
    ]);
    expect(
      database
        .prepare('SELECT movie_id, country_code FROM production_countries')
        .all(),
    ).toEqual([{ movie_id: 1, country_code: 'FR' }]);
    expect(
      database.prepare('PRAGMA foreign_key_list(production_countries)').all(),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ table: 'countries', from: 'country_code' }),
      ]),
    );
    database.close();
  });

  it('enforces foreign keys and positive observation values', () => {
    const database = new DatabaseSync(':memory:');

    initializeSchema(database);

    expect(() =>
      database.exec(`
        INSERT INTO movie_observations (film_id, observed_at, runtime)
        VALUES (999, '2026-01-01T00:00:00Z', 120)
      `),
    ).toThrow();
    database.exec(`
      INSERT INTO films (id, title, original_title) VALUES (1, 'Film', 'Movie');
    `);
    expect(() =>
      database.exec(`
        INSERT INTO movie_observations (film_id, observed_at, budget)
        VALUES (1, '2026-01-01T00:00:00Z', 0)
      `),
    ).toThrow();
  });

  it('rolls back schema initialization errors', () => {
    const database = new DatabaseSync(':memory:');
    const invalidSchema = schemaSql.replace(
      'CREATE TABLE IF NOT EXISTS films',
      'CREATE TABLE films',
    );

    database.exec('CREATE TABLE films (id INTEGER PRIMARY KEY)');
    expect(() => {
      initializeSchema(database, invalidSchema);
    }).toThrow();
    expect(
      database
        .prepare('SELECT name FROM sqlite_master WHERE type = ?')
        .all('table'),
    ).toEqual([{ name: 'films' }]);
  });
});

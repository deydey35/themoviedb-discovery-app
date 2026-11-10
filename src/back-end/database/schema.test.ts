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
        { name: 'production_countries' },
        { name: 'movie_production_countries' },
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

import { DatabaseSync } from 'node:sqlite';

export const schemaSql = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS films (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    original_title TEXT NOT NULL,
    overview TEXT,
    release_date TEXT,
    release_year INTEGER GENERATED ALWAYS AS (
      CASE
        WHEN release_date IS NULL OR release_date = '' THEN NULL
        ELSE CAST(substr(release_date, 1, 4) AS INTEGER)
      END
    ) STORED,
    original_language TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    tagline TEXT
  );

  CREATE TABLE IF NOT EXISTS movie_observations (
    film_id INTEGER NOT NULL REFERENCES films (id) ON DELETE CASCADE,
    observed_at TEXT NOT NULL,
    popularity REAL,
    vote_average REAL,
    vote_count INTEGER,
    runtime INTEGER CHECK (runtime IS NULL OR runtime > 0),
    budget INTEGER CHECK (budget IS NULL OR budget > 0),
    revenue INTEGER CHECK (revenue IS NULL OR revenue > 0),
    PRIMARY KEY (film_id, observed_at)
  );

  CREATE TABLE IF NOT EXISTS genres (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0)
  );

  CREATE TABLE IF NOT EXISTS movie_genres (
    movie_id INTEGER NOT NULL REFERENCES films (id) ON DELETE CASCADE,
    genre_id INTEGER NOT NULL REFERENCES genres (id) ON DELETE RESTRICT,
    PRIMARY KEY (movie_id, genre_id)
  );

  CREATE TABLE IF NOT EXISTS production_countries (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0)
  );

  CREATE TABLE IF NOT EXISTS movie_production_countries (
    movie_id INTEGER NOT NULL REFERENCES films (id) ON DELETE CASCADE,
    country_code TEXT NOT NULL REFERENCES production_countries (code) ON DELETE RESTRICT,
    PRIMARY KEY (movie_id, country_code)
  );
`;

export function initializeSchema(
  database: DatabaseSync,
  sql: string = schemaSql,
): void {
  database.exec('BEGIN');
  try {
    database.exec(sql);
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

export function openDatabase(path: string): DatabaseSync {
  let database: DatabaseSync | undefined;
  try {
    database = new DatabaseSync(path);
    initializeSchema(database);
    return database;
  } catch (error) {
    database?.close();
    throw error;
  }
}

import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import type { MovieDetails } from '../types/MoviesTypes';
import { initializeSchema } from './schema';
import { syncMovieProductionCountries } from './movie-country-repository';

function createMovie(
  productionCountries: MovieDetails['production_countries'],
): MovieDetails {
  return {
    id: 42,
    title: 'Film',
    original_title: 'Movie',
    overview: 'A film',
    release_date: '2024-01-01',
    original_language: 'en',
    poster_path: null,
    backdrop_path: null,
    vote_average: 7,
    vote_count: 10,
    genres: [],
    production_countries: productionCountries,
    tagline: null,
  };
}

describe('movie country repository', () => {
  it('updates a movie and replaces its production country associations', () => {
    const database = new DatabaseSync(':memory:');
    initializeSchema(database);

    syncMovieProductionCountries(
      database,
      createMovie([{ iso_3166_1: 'FR', name: 'France' }]),
    );
    syncMovieProductionCountries(database, {
      ...createMovie([{ iso_3166_1: 'US', name: 'United States' }]),
      title: 'Updated film',
    });

    expect(database.prepare('SELECT title FROM films').get()).toEqual({
      title: 'Updated film',
    });
    expect(
      database
        .prepare('SELECT movie_id, country_code FROM production_countries')
        .all(),
    ).toEqual([{ movie_id: 42, country_code: 'US' }]);
    expect(
      database.prepare('SELECT code, name FROM countries ORDER BY code').all(),
    ).toEqual([
      { code: 'FR', name: 'France' },
      { code: 'US', name: 'United States' },
    ]);
    database.close();
  });

  it('removes all country associations when TMDB returns none', () => {
    const database = new DatabaseSync(':memory:');
    initializeSchema(database);
    syncMovieProductionCountries(
      database,
      createMovie([{ iso_3166_1: 'FR', name: 'France' }]),
    );

    syncMovieProductionCountries(database, createMovie([]));

    expect(
      database.prepare('SELECT country_code FROM production_countries').all(),
    ).toEqual([]);
    database.close();
  });

  it('rolls back movie and country changes when an association fails', () => {
    const database = new DatabaseSync(':memory:');
    initializeSchema(database);
    database.exec(`
      CREATE TRIGGER reject_country_association
      BEFORE INSERT ON production_countries
      BEGIN
        SELECT RAISE(ABORT, 'country association rejected');
      END;
    `);

    expect(() =>
      syncMovieProductionCountries(
        database,
        createMovie([{ iso_3166_1: 'FR', name: 'France' }]),
      ),
    ).toThrow('country association rejected');
    expect(database.prepare('SELECT id FROM films').all()).toEqual([]);
    expect(database.prepare('SELECT code FROM countries').all()).toEqual([]);
    expect(() => database.exec('ROLLBACK')).toThrow();
    database.close();
  });
});

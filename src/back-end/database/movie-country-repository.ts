import { DatabaseSync } from 'node:sqlite';
import type { MovieDetails } from '../types/MoviesTypes';

export function syncMovieProductionCountries(
  database: DatabaseSync,
  movie: MovieDetails,
): void {
  database.exec('BEGIN');
  try {
    database
      .prepare(`
        INSERT INTO films (
          id, title, original_title, overview, release_date,
          original_language, poster_path, backdrop_path, tagline
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          title = excluded.title,
          original_title = excluded.original_title,
          overview = excluded.overview,
          release_date = excluded.release_date,
          original_language = excluded.original_language,
          poster_path = excluded.poster_path,
          backdrop_path = excluded.backdrop_path,
          tagline = excluded.tagline
      `)
      .run(
        movie.id,
        movie.title,
        movie.original_title,
        movie.overview,
        movie.release_date,
        movie.original_language,
        movie.poster_path,
        movie.backdrop_path,
        movie.tagline,
      );

    const upsertCountry = database.prepare(`
      INSERT INTO production_countries (code, name)
      VALUES (?, ?)
      ON CONFLICT (code) DO UPDATE SET name = excluded.name
    `);
    const insertAssociation = database.prepare(`
      INSERT INTO movie_production_countries (movie_id, country_code)
      VALUES (?, ?)
    `);

    database
      .prepare('DELETE FROM movie_production_countries WHERE movie_id = ?')
      .run(movie.id);

    for (const country of movie.production_countries) {
      upsertCountry.run(country.iso_3166_1, country.name);
      insertAssociation.run(movie.id, country.iso_3166_1);
    }

    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

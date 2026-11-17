import { DatabaseSync } from 'node:sqlite';

export interface Genre {
  id: number;
  name: string;
}

function toGenre(row: Record<string, unknown>): Genre {
  if (typeof row.id !== 'number' || typeof row.name !== 'string') {
    throw new TypeError('Invalid genre row');
  }

  return { id: row.id, name: row.name };
}

export function findGenreById(
  database: DatabaseSync,
  id: number,
): Genre | undefined {
  const row = database
    .prepare('SELECT id, name FROM genres WHERE id = ?')
    .get(id);
  return row === undefined ? undefined : toGenre(row);
}

export function listGenres(database: DatabaseSync): Genre[] {
  const rows = database
    .prepare('SELECT id, name FROM genres ORDER BY id ASC')
    .all();
  return rows.map(toGenre);
}

export function upsertGenres(
  database: DatabaseSync,
  genres: Iterable<Genre>,
): void {
  database.exec('BEGIN');
  try {
    const statement = database.prepare(`
      INSERT INTO genres (id, name)
      VALUES (?, ?)
      ON CONFLICT (id) DO UPDATE SET name = excluded.name
    `);

    for (const genre of genres) {
      statement.run(genre.id, genre.name);
    }

    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

export function deleteUnusedGenres(database: DatabaseSync): number {
  database.exec('BEGIN');
  try {
    const result = database
      .prepare(`
        DELETE FROM genres
        WHERE NOT EXISTS (
          SELECT 1 FROM movie_genres WHERE movie_genres.genre_id = genres.id
        )
      `)
      .run();
    database.exec('COMMIT');
    return Number(result.changes);
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

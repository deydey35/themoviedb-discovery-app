import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import {
  deleteUnusedGenres,
  findGenreById,
  listGenres,
  type Genre,
  upsertGenres,
} from './genre-repository';
import { initializeSchema } from './schema';

function createDatabase(): DatabaseSync {
  const database = new DatabaseSync(':memory:');
  initializeSchema(database);
  return database;
}

describe('genre repository', () => {
  it('finds an existing genre and returns undefined for an unknown id', () => {
    // Arrange
    const database = createDatabase();
    database.exec("INSERT INTO genres (id, name) VALUES (10, 'Comedy')");

    // Act and assert
    expect(findGenreById(database, 10)).toEqual({ id: 10, name: 'Comedy' });
    expect(findGenreById(database, 99)).toBeUndefined();
    database.close();
  });

  it('lists genres in ascending identifier order', () => {
    // Arrange
    const database = createDatabase();
    upsertGenres(database, [
      { id: 20, name: 'Drama' },
      { id: 5, name: 'Action' },
    ]);

    // Act and assert
    expect(listGenres(database)).toEqual([
      { id: 5, name: 'Action' },
      { id: 20, name: 'Drama' },
    ]);
    database.close();
  });

  it('inserts and updates genres without creating duplicates', () => {
    // Arrange
    const database = createDatabase();
    upsertGenres(database, [{ id: 10, name: 'Comedy' }]);

    // Act
    upsertGenres(database, [{ id: 10, name: 'Comédie' }]);

    // Assert
    expect(listGenres(database)).toEqual([{ id: 10, name: 'Comédie' }]);
    database.close();
  });

  it('accepts arrays and other iterables, keeps the last duplicate, and supports empty input', () => {
    // Arrange
    const database = createDatabase();
    const iterable = new Set<Genre>([
      { id: 10, name: 'Comedy' },
      { id: 20, name: 'Drama' },
    ]);

    // Act
    upsertGenres(database, iterable);
    upsertGenres(
      database,
      (function* () {
        yield { id: 10, name: 'Comédie' };
        yield { id: 10, name: 'Humour' };
      })(),
    );
    upsertGenres(database, []);

    // Assert
    expect(listGenres(database)).toEqual([
      { id: 10, name: 'Humour' },
      { id: 20, name: 'Drama' },
    ]);
    database.close();
  });

  it('rejects a genre with an empty name and rolls back the batch', () => {
    // Arrange
    const database = createDatabase();

    // Act and assert
    expect(() =>
      upsertGenres(database, [
        { id: 10, name: 'Comedy' },
        { id: 20, name: '   ' },
      ]),
    ).toThrow();
    expect(listGenres(database)).toEqual([]);
    database.close();
  });

  it('rejects malformed rows and rolls back cleanup errors', () => {
    // Arrange
    const database = createDatabase();
    database.exec(`
      DROP TABLE movie_genres;
      DROP TABLE genres;
      CREATE TABLE genres (id TEXT, name INTEGER);
      INSERT INTO genres (id, name) VALUES ('invalid', 10);
    `);

    // Act and assert
    expect(() => listGenres(database)).toThrow('Invalid genre row');
    expect(() => deleteUnusedGenres(database)).toThrow();
    expect(() => database.exec('ROLLBACK')).toThrow();
    database.close();
  });
});

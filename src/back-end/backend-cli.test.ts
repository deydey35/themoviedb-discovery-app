import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it, vi } from 'vitest';
import { defaultDatabasePath, runCli } from './backend-cli';
import { openDatabase } from './database/schema';

describe('backend CLI', () => {
  it('initializes the default database path', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'movies-cli-'));
    const path = join(directory, 'movies.sqlite');
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await runCli(['node', 'backend-cli', '--path', path]);

    const database = new DatabaseSync(path);
    expect(
      database
        .prepare('SELECT name FROM sqlite_master WHERE type = ?')
        .all('table'),
    ).not.toEqual([]);
    expect(log).toHaveBeenCalledWith(`Database initialized at ${path}`);
    database.close();
    log.mockRestore();
    rmSync(directory, { recursive: true, force: true });
  });

  it('keeps the documented default path configurable', () => {
    expect(defaultDatabasePath).toBe('./data/movies.sqlite');
    expect(existsSync('src/back-end/backend-cli.ts')).toBe(true);
  });

  it('propagates database opening failures', () => {
    const directory = mkdtempSync(join(tmpdir(), 'movies-cli-'));

    expect(() => openDatabase(directory)).toThrow();
    rmSync(directory, { recursive: true, force: true });
  });

  it('imports genres into a selected database and reports the count', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'movies-cli-'));
    const databasePath = join(directory, 'custom.sqlite');
    const csvPath = join(directory, 'genres.csv');
    writeFileSync(csvPath, 'id,name\n28,Action\n35,Comedy\n');
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await runCli([
      'node',
      'backend-cli',
      '--path',
      databasePath,
      'add-genres',
      csvPath,
    ]);

    const database = new DatabaseSync(databasePath);
    expect(
      database.prepare('SELECT id, name FROM genres ORDER BY id').all(),
    ).toEqual([
      { id: 28, name: 'Action' },
      { id: 35, name: 'Comedy' },
    ]);
    expect(log).toHaveBeenCalledWith(
      `Imported 2 genre(s) into ${databasePath}`,
    );
    database.close();
    log.mockRestore();
    rmSync(directory, { recursive: true, force: true });
  });

  it('cleans only genres without a movie association', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'movies-cli-'));
    const databasePath = join(directory, 'custom.sqlite');
    const database = openDatabase(databasePath);
    database.exec(`
      INSERT INTO genres (id, name) VALUES (10, 'Used'), (20, 'Unused');
      INSERT INTO films (id, title, original_title) VALUES (1, 'Film', 'Movie');
      INSERT INTO movie_genres (movie_id, genre_id) VALUES (1, 10);
    `);
    database.close();
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await runCli([
      'node',
      'backend-cli',
      '--path',
      databasePath,
      'clean-genres',
    ]);

    const remaining = new DatabaseSync(databasePath)
      .prepare('SELECT id, name FROM genres')
      .all();
    expect(remaining).toEqual([{ id: 10, name: 'Used' }]);
    expect(log).toHaveBeenCalledWith(
      `Removed 1 unused genre(s) from ${databasePath}`,
    );
    log.mockRestore();
    rmSync(directory, { recursive: true, force: true });
  });

  it('validates the CSV before opening the database', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'movies-cli-'));
    const csvPath = join(directory, 'invalid.csv');
    const databasePath = join(directory, 'not-a-database');
    writeFileSync(csvPath, 'invalid,name\n1,Action\n');

    await expect(
      runCli([
        'node',
        'backend-cli',
        '--path',
        databasePath,
        'add-genres',
        csvPath,
      ]),
    ).rejects.toThrow('expected id and name');
    expect(existsSync(databasePath)).toBe(false);
    rmSync(directory, { recursive: true, force: true });
  });
});

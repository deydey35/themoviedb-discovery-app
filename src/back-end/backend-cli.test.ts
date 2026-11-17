import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultDatabasePath, runCli } from './backend-cli';
import { openDatabase } from './database/schema';

describe('backend CLI', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

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

  it('imports and updates countries in a selected database without duplicates', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'movies-cli-'));
    const databasePath = join(directory, 'custom.sqlite');
    const csvPath = join(directory, 'countries.csv');
    const database = openDatabase(databasePath);
    database.exec(
      "INSERT INTO countries (code, name) VALUES ('FR', 'Old name')",
    );
    database.close();
    writeFileSync(csvPath, 'code,name\nFR,France\nUS,United States\n');
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const close = vi.spyOn(DatabaseSync.prototype, 'close');

    await runCli([
      'node',
      'backend-cli',
      '--path',
      databasePath,
      'add-countries',
      csvPath,
    ]);

    expect(close).toHaveBeenCalledOnce();
    close.mockRestore();
    const imported = new DatabaseSync(databasePath);
    expect(
      imported.prepare('SELECT code, name FROM countries ORDER BY code').all(),
    ).toEqual([
      { code: 'FR', name: 'France' },
      { code: 'US', name: 'United States' },
    ]);
    imported.close();
    expect(log).toHaveBeenCalledWith(
      `Imported 2 country/countries into ${databasePath}`,
    );
    log.mockRestore();
    rmSync(directory, { recursive: true, force: true });
  });

  it('validates countries before opening the database', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'movies-cli-'));
    const csvPath = join(directory, 'invalid.csv');
    const databasePath = join(directory, 'not-a-database');
    writeFileSync(csvPath, 'invalid,name\nFR,France\n');

    await expect(
      runCli([
        'node',
        'backend-cli',
        '--path',
        databasePath,
        'add-countries',
        csvPath,
      ]),
    ).rejects.toThrow('expected code and name');
    expect(existsSync(databasePath)).toBe(false);
    rmSync(directory, { recursive: true, force: true });
  });

  it('rolls back a failed country import, closes the database, and propagates the error', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'movies-cli-'));
    const databasePath = join(directory, 'custom.sqlite');
    const csvPath = join(directory, 'countries.csv');
    const database = openDatabase(databasePath);
    database.exec(`
      CREATE TRIGGER reject_us BEFORE INSERT ON countries
      WHEN NEW.code = 'US'
      BEGIN
        SELECT RAISE(ABORT, 'country import rejected');
      END;
    `);
    database.close();
    writeFileSync(csvPath, 'code,name\nFR,France\nUS,United States\n');
    const close = vi.spyOn(DatabaseSync.prototype, 'close');

    await expect(
      runCli([
        'node',
        'backend-cli',
        '--path',
        databasePath,
        'add-countries',
        csvPath,
      ]),
    ).rejects.toThrow('country import rejected');

    expect(close).toHaveBeenCalledOnce();
    close.mockRestore();
    const check = new DatabaseSync(databasePath);
    expect(check.prepare('SELECT code FROM countries').all()).toEqual([]);
    check.close();
    rmSync(directory, { recursive: true, force: true });
  });

  it('synchronizes countries from TMDB into a selected database', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'movies-cli-'));
    const databasePath = join(directory, 'custom.sqlite');
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        { iso_3166_1: 'FR', english_name: 'France' },
        { iso_3166_1: 'US', english_name: 'United States' },
      ],
    });
    vi.stubEnv('TMDB_ACCESS_TOKEN', 'test-access-token');
    vi.stubGlobal('fetch', fetchMock);

    await runCli([
      'node',
      'backend-cli',
      '--path',
      databasePath,
      'sync-countries',
    ]);

    const database = new DatabaseSync(databasePath);
    expect(
      database.prepare('SELECT code, name FROM countries ORDER BY code').all(),
    ).toEqual([
      { code: 'FR', name: 'France' },
      { code: 'US', name: 'United States' },
    ]);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledWith(
      `Synchronized 2 country/countries into ${databasePath}`,
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

    const remainingDatabase = new DatabaseSync(databasePath);
    const remaining = remainingDatabase
      .prepare('SELECT id, name FROM genres')
      .all();
    expect(remaining).toEqual([{ id: 10, name: 'Used' }]);
    remainingDatabase.close();
    expect(log).toHaveBeenCalledWith(
      `Removed 1 unused genre(s) from ${databasePath}`,
    );
    log.mockRestore();
    rmSync(directory, { recursive: true, force: true });
  });

  it('cleans only countries without a movie association and reports the result', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'movies-cli-'));
    const databasePath = join(directory, 'custom.sqlite');
    const database = openDatabase(databasePath);
    database.exec(`
      INSERT INTO countries (code, name)
      VALUES ('FR', 'France'), ('US', 'United States');
      INSERT INTO films (id, title, original_title) VALUES (1, 'Film', 'Movie');
      INSERT INTO production_countries (movie_id, country_code) VALUES (1, 'FR');
    `);
    database.close();
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const close = vi.spyOn(DatabaseSync.prototype, 'close');

    await runCli([
      'node',
      'backend-cli',
      '--path',
      databasePath,
      'clean-countries',
    ]);

    expect(close).toHaveBeenCalledOnce();
    close.mockRestore();
    const remainingDatabase = new DatabaseSync(databasePath);
    const remaining = remainingDatabase
      .prepare('SELECT code, name FROM countries')
      .all();
    expect(remaining).toEqual([{ code: 'FR', name: 'France' }]);
    remainingDatabase.close();
    expect(log).toHaveBeenCalledWith(
      `Removed 1 unused country/countries from ${databasePath}`,
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

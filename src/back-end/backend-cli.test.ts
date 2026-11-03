import { existsSync, mkdtempSync, rmSync } from 'node:fs';
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
});

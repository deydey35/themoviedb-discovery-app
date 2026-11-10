import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import { parseGenresCsv } from './database/genre-csv';
import { deleteUnusedGenres, upsertGenres } from './database/genre-repository';
import { openDatabase } from './database/schema';

export const defaultDatabasePath = './data/movies.sqlite';

export function createCli(): Command {
  const program = new Command();

  program
    .name('backend-cli')
    .description('Manage the movies SQLite database')
    .option('-p, --path <path>', 'SQLite database path', defaultDatabasePath)
    .action((options: { path: string }) => {
      initializeDatabase(options.path);
    });

  program
    .command('add-genres <csv-file>')
    .description('Import genres from a CSV file')
    .action(async (csvFile: string) => {
      const options = program.opts<{ path: string }>();
      const genres = parseGenresCsv(await readFile(csvFile, 'utf8'));
      const databasePath = resolve(options.path);
      mkdirSync(dirname(databasePath), { recursive: true });
      const database = openDatabase(databasePath);
      try {
        upsertGenres(database, genres);
      } finally {
        database.close();
      }
      console.log(`Imported ${genres.length} genre(s) into ${databasePath}`);
    });

  program
    .command('clean-genres')
    .description('Remove genres not associated with a film')
    .action(() => {
      const options = program.opts<{ path: string }>();
      const databasePath = resolve(options.path);
      const database = openDatabase(databasePath);
      let deletedCount: number;
      try {
        deletedCount = deleteUnusedGenres(database);
      } finally {
        database.close();
      }
      console.log(
        `Removed ${deletedCount} unused genre(s) from ${databasePath}`,
      );
    });

  return program;
}

function initializeDatabase(path: string): void {
  const databasePath = resolve(path);
  mkdirSync(dirname(databasePath), { recursive: true });
  const database = openDatabase(databasePath);
  database.close();
  console.log(`Database initialized at ${databasePath}`);
}

export async function runCli(argv: string[] = process.argv): Promise<void> {
  await createCli().parseAsync(argv);
}

/* c8 ignore next 4 */
if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  await runCli();
}

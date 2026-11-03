import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { openDatabase } from './database/schema';

export const defaultDatabasePath = './data/movies.sqlite';

export function createCli(): Command {
  const program = new Command();

  program
    .name('backend-cli')
    .description('Initialize the movies SQLite database')
    .option('-p, --path <path>', 'SQLite database path', defaultDatabasePath)
    .action((options: { path: string }) => {
      const databasePath = resolve(options.path);
      mkdirSync(dirname(databasePath), { recursive: true });
      const database = openDatabase(databasePath);
      database.close();
      console.log(`Database initialized at ${databasePath}`);
    });

  return program;
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

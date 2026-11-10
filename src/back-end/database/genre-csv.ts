import { parse } from 'csv-parse/sync';
import type { Genre } from './genre-repository';

function parseGenreId(value: string, rowNumber: number): number {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error(`Invalid genre id at row ${rowNumber}: ${value}`);
  }

  const id = Number(value);
  if (!Number.isSafeInteger(id)) {
    throw new Error(`Genre id is not a safe integer at row ${rowNumber}`);
  }

  return id;
}

export function parseGenresCsv(contents: string): Genre[] {
  let records: string[][];
  try {
    records = parse(contents, {
      bom: true,
      columns: false,
      skip_empty_lines: true,
    }) as string[][];
  } catch (error) {
    throw new Error(`Invalid genres CSV: ${String(error)}`, { cause: error });
  }

  const [header, ...rows] = records;
  if (
    header === undefined ||
    header.length !== 2 ||
    new Set(header.map((value) => value.toLowerCase())).size !== 2 ||
    !header.every((value) => ['id', 'name'].includes(value.toLowerCase()))
  ) {
    throw new Error('Invalid genres CSV headers: expected id and name');
  }

  const idIndex = header.findIndex((value) => value.toLowerCase() === 'id');
  const nameIndex = header.findIndex((value) => value.toLowerCase() === 'name');

  return rows.map((row, index) => {
    const rowNumber = index + 2;
    const name = row[nameIndex]!;
    if (name.trim() === '') {
      throw new Error(`Invalid genre name at row ${rowNumber}`);
    }

    return {
      id: parseGenreId(row[idIndex]!, rowNumber),
      name,
    };
  });
}

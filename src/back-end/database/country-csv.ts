import { parse } from 'csv-parse/sync';
import type { Country } from './country-repository';

export function parseCountriesCsv(contents: string): Country[] {
  let records: string[][];
  try {
    records = parse(contents, {
      bom: true,
      columns: false,
      skip_empty_lines: true,
    }) as string[][];
  } catch (error) {
    throw new Error(`Invalid countries CSV: ${String(error)}`, {
      cause: error,
    });
  }

  const [header, ...rows] = records;
  if (
    header === undefined ||
    header.length !== 2 ||
    new Set(header.map((value) => value.toLowerCase())).size !== 2 ||
    !header.every((value) => ['code', 'name'].includes(value.toLowerCase()))
  ) {
    throw new Error('Invalid countries CSV headers: expected code and name');
  }

  const codeIndex = header.findIndex((value) => value.toLowerCase() === 'code');
  const nameIndex = header.findIndex((value) => value.toLowerCase() === 'name');

  return rows.map((row, index) => {
    const rowNumber = index + 2;
    const code = row[codeIndex]!.trim();
    const name = row[nameIndex]!.trim();

    if (!/^[A-Z]{2}$/.test(code)) {
      throw new Error(`Invalid country code at row ${rowNumber}: ${code}`);
    }
    if (name === '') {
      throw new Error(`Invalid country name at row ${rowNumber}`);
    }

    return { code, name };
  });
}

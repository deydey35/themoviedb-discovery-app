import { describe, expect, it } from 'vitest';
import { parseCountriesCsv } from './country-csv';

describe('country CSV parser', () => {
  it('parses case-insensitive headers in either order, BOM, CRLF, and quoted values', () => {
    expect(
      parseCountriesCsv(
        '\uFEFFNAME,Code\r\n"United, States",US\r\n"Côte d\'Ivoire",CI',
      ),
    ).toEqual([
      { code: 'US', name: 'United, States' },
      { code: 'CI', name: "Côte d'Ivoire" },
    ]);
  });

  it('trims values, ignores blank lines, and accepts a header-only document', () => {
    expect(parseCountriesCsv('code,name\n\n FR , France \n\n')).toEqual([
      { code: 'FR', name: 'France' },
    ]);
    expect(parseCountriesCsv('code,name')).toEqual([]);
  });

  it('parses escaped quotes inside quoted names', () => {
    expect(parseCountriesCsv('code,name\nUS,"The ""United States"""')).toEqual([
      { code: 'US', name: 'The "United States"' },
    ]);
  });

  it('rejects invalid headers, row widths, codes, names, and malformed CSV', () => {
    expect(() => parseCountriesCsv('id,name\nUS,United States')).toThrow(
      'expected code and name',
    );
    expect(() => parseCountriesCsv('code,code\nUS,United States')).toThrow(
      'expected code and name',
    );
    expect(() => parseCountriesCsv('code,name\nUS')).toThrow(
      'Invalid countries CSV',
    );
    expect(() => parseCountriesCsv('code,name\nfr,France')).toThrow(
      'Invalid country code',
    );
    expect(() => parseCountriesCsv('code,name\nUSA,United States')).toThrow(
      'Invalid country code',
    );
    expect(() => parseCountriesCsv('code,name\n1F,Country')).toThrow(
      'Invalid country code',
    );
    expect(() => parseCountriesCsv('code,name\nFR,   ')).toThrow(
      'Invalid country name',
    );
    expect(() => parseCountriesCsv('code,name\nFR,"France')).toThrow(
      'Invalid countries CSV',
    );
  });
});

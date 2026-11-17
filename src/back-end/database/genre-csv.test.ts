import { describe, expect, it } from 'vitest';
import { parseGenresCsv } from './genre-csv';

describe('genre CSV parser', () => {
  it('parses case-insensitive headers in either order, BOM, CRLF, and quoted values', () => {
    expect(
      parseGenresCsv(
        '\uFEFFNAME,Id\r\n"Science, Fiction",878\r\n"Film ""Noir""",879',
      ),
    ).toEqual([
      { id: 878, name: 'Science, Fiction' },
      { id: 879, name: 'Film "Noir"' },
    ]);
  });

  it('ignores empty lines', () => {
    expect(parseGenresCsv('id,name\n\n28,Action\n\n')).toEqual([
      { id: 28, name: 'Action' },
    ]);
  });

  it('rejects invalid headers, rows, ids, names, and malformed CSV', () => {
    expect(() => parseGenresCsv('code,name\n1,Action')).toThrow(
      'expected id and name',
    );
    expect(() => parseGenresCsv('id,name\n1')).toThrow('Invalid genres CSV');
    expect(() => parseGenresCsv('id,name\n0,Action')).toThrow(
      'Invalid genre id',
    );
    expect(() => parseGenresCsv('id,name\n9007199254740992,Action')).toThrow(
      'safe integer',
    );
    expect(() => parseGenresCsv('id,name\n1,   ')).toThrow(
      'Invalid genre name',
    );
    expect(() => parseGenresCsv('id,name\n1,"Action')).toThrow(
      'Invalid genres CSV',
    );
  });
});

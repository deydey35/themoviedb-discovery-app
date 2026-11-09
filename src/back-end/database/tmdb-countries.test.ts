import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchTmdbCountries } from './tmdb-countries';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchTmdbCountries', () => {
  it('maps TMDB country records to repository countries', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        { iso_3166_1: 'FR', english_name: 'France' },
        { iso_3166_1: 'US', english_name: 'United States of America' },
      ],
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchTmdbCountries('test-token')).resolves.toEqual([
      { code: 'FR', name: 'France' },
      { code: 'US', name: 'United States of America' },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/configuration/countries',
      {
        headers: {
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json;charset=utf-8',
        },
      },
    );
  });

  it('throws when TMDB rejects the countries request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );

    await expect(fetchTmdbCountries('test-token')).rejects.toThrow(
      'TMDB countries request failed with status 503',
    );
  });
});

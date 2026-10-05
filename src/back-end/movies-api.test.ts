import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerMoviesApi } from './movies-api';

type RouteHandler = (
  request: {
    query: Record<string, string | undefined>;
    params: Record<string, string>;
  },
  response: {
    json: (body: unknown) => void;
    status: (code: number) => { json: (body: unknown) => void };
  },
) => Promise<void>;

const rawMovie = {
  adult: false,
  backdrop_path: '/backdrop.jpg',
  genre_ids: [18],
  id: 42,
  original_language: 'en',
  original_title: 'The Answer',
  overview: 'A movie overview',
  popularity: 12.5,
  poster_path: '/poster.jpg',
  release_date: '2026-01-01',
  title: 'La réponse',
  video: false,
  vote_average: 8.2,
  vote_count: 100,
};

const getHandlers = () => {
  const get = vi.fn();
  registerMoviesApi({ get } as never);
  return new Map<string, RouteHandler>(
    get.mock.calls.map(([path, handler]) => [path, handler as RouteHandler]),
  );
};

const createResponse = () => {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return { json, status };
};

describe('movies API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns popular movies with supplied query parameters', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        page: 2,
        results: [rawMovie],
        total_pages: 4,
        total_results: 80,
      }),
    } as unknown as Response);
    const response = createResponse();

    await getHandlers().get('/api/movies/popular')?.(
      {
        query: { language: 'en-US', page: '2', region: 'US' },
        params: {},
      },
      response,
    );

    expect(fetch).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/movie/popular?language=en-US&page=2&region=US',
      expect.any(Object),
    );
    expect(response.json).toHaveBeenCalledWith({
      page: 2,
      results: [
        {
          backdrop_path: '/backdrop.jpg',
          genre_ids: [18],
          id: 42,
          original_language: 'en',
          original_title: 'The Answer',
          overview: 'A movie overview',
          popularity: 12.5,
          poster_path: '/poster.jpg',
          release_date: '2026-01-01',
          title: 'La réponse',
          vote_average: 8.2,
          vote_count: 100,
        },
      ],
      total_pages: 4,
      total_results: 80,
    });
  });

  it('uses default parameters for popular movies', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      }),
    } as unknown as Response);

    await getHandlers().get('/api/movies/popular')?.(
      { query: {}, params: {} },
      createResponse(),
    );

    expect(fetch).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/movie/popular?language=fr-FR&page=1&region=FR',
      expect.any(Object),
    );
  });

  it('returns an error when popular movies cannot be fetched', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 503,
    } as Response);
    const response = createResponse();

    await getHandlers().get('/api/movies/popular')?.(
      { query: {}, params: {} },
      response,
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: 'Failed to fetch popular movies',
    });
  });

  it('returns movie details and encodes the movie id', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        ...rawMovie,
        genre_ids: undefined,
        genres: [{ id: 18, name: 'Drama' }],
      }),
    } as unknown as Response);
    const response = createResponse();

    await getHandlers().get('/api/movies/:id')?.(
      {
        query: { language: 'fr-FR' },
        params: { id: '42/answer' },
      },
      response,
    );

    expect(fetch).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/movie/42%2Fanswer?language=fr-FR',
      expect.any(Object),
    );
    expect(response.json).toHaveBeenCalledWith({
      backdrop_path: '/backdrop.jpg',
      genre_ids: [18],
      id: 42,
      original_language: 'en',
      original_title: 'The Answer',
      overview: 'A movie overview',
      popularity: 12.5,
      poster_path: '/poster.jpg',
      release_date: '2026-01-01',
      title: 'La réponse',
      vote_average: 8.2,
      vote_count: 100,
    });
  });

  it('uses the default language for movie details', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        ...rawMovie,
        genres: [],
      }),
    } as unknown as Response);

    await getHandlers().get('/api/movies/:id')?.(
      { query: {}, params: { id: '42' } },
      createResponse(),
    );

    expect(fetch).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/movie/42?language=fr-FR',
      expect.any(Object),
    );
  });

  it('returns an error when movie details cannot be fetched', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    const response = createResponse();

    await getHandlers().get('/api/movies/:id')?.(
      { query: {}, params: { id: '42' } },
      response,
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: 'Failed to fetch movie details',
    });
  });

  it('returns an error when the details API responds unsuccessfully', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);
    const response = createResponse();

    await getHandlers().get('/api/movies/:id')?.(
      { query: {}, params: { id: '42' } },
      response,
    );

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: 'Failed to fetch movie details',
    });
  });
});

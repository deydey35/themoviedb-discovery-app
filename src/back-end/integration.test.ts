import express from 'express';
import { createServer, get, type Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registerHealthApi } from './health-api';
import { registerMoviesApi } from './movies-api';

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

type HttpResponse = {
  statusCode: number;
  body: unknown;
};

const request = (server: Server, path: string): Promise<HttpResponse> =>
  new Promise((resolve, reject) => {
    const address = server.address();

    if (!address || typeof address === 'string') {
      reject(new Error('The test server is not listening'));
      return;
    }

    const response: string[] = [];
    const clientRequest = get(
      { host: '127.0.0.1', path, port: address.port },
      (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => response.push(chunk));
        res.on('end', () => {
          try {
            resolve({
              statusCode: res.statusCode ?? 0,
              body: JSON.parse(response.join('')),
            });
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    clientRequest.on('error', reject);
  });

describe('back-end HTTP integration', () => {
  let server: Server;

  beforeEach(async () => {
    const app = express();
    registerHealthApi(app);
    registerMoviesApi(app);

    server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    vi.restoreAllMocks();
  });

  it('connects the health route through the real HTTP server', async () => {
    const response = await request(server, '/api/health');

    expect(response).toEqual({
      statusCode: 200,
      body: { status: 'ok' },
    });
  });

  it('connects the movie route to the mocked TMDB service', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        page: 1,
        results: [rawMovie],
        total_pages: 1,
        total_results: 1,
      }),
    } as unknown as Response);

    const response = await request(
      server,
      '/api/movies/popular?language=fr-FR&page=1&region=FR',
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      page: 1,
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
      total_pages: 1,
      total_results: 1,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/movie/popular?language=fr-FR&page=1&region=FR',
      expect.any(Object),
    );
  });
});

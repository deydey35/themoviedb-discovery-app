import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the necessary modules and functions
const { fetchMock, getMock, listenMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  getMock: vi.fn(),
  listenMock: vi.fn(),
}));

vi.mock('express', () => ({
  default: vi.fn(() => ({
    get: getMock,
    listen: listenMock,
  })),
}));

vi.mock('./config', () => ({
  tmdbAccessToken: 'test-access-token',
}));

vi.stubGlobal('fetch', fetchMock);

// Import the code under test after setting up the mocks
import './index';

// Define types for the request and response objects used in the route handlers
type RouteHandler = (req: Request, res: Response) => void | Promise<void>;

// Create a map of route handlers for easy access in tests
const routeHandlers = new Map<string, RouteHandler>(
  getMock.mock.calls.map(([path, handler]) => [
    path as string,
    handler as RouteHandler,
  ]),
);

// Check if the server was started on the expected port
const serverWasStarted = listenMock.mock.calls.some(([port]) => port === 3000);

describe('back-end server routes', () => {
  // Clear mocks before each test to ensure isolation
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('server setup', () => {
    describe('server listening', () => {
      it('starts the server on port 3000', () => {
        expect(serverWasStarted).toBe(true);
      });
    });
  });

  describe('route registration', () => {
    it('registers the /api/movies/popular route', () => {
      expect(routeHandlers.has('/api/movies/popular')).toBe(true);
    });

    it('registers the movie details route', () => {
      expect(routeHandlers.has('/api/movies/:id')).toBe(true);
    });

    it('registers the /api/health route', () => {
      expect(routeHandlers.has('/api/health')).toBe(true);
    });
  });

  describe('movie details route', () => {
    it('fetches and transforms a movie by id', async () => {
      const responseJson = vi.fn();
      const rawMovie = {
        adult: false,
        backdrop_path: '/backdrop.jpg',
        genres: [{ id: 18, name: 'Drama' }],
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
      fetchMock.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(rawMovie),
      });

      const handler = routeHandlers.get('/api/movies/:id');
      await handler?.(
        {
          params: { id: '42' },
          query: { language: 'fr-FR' },
        } as unknown as Request,
        { json: responseJson } as unknown as Response,
      );

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/movie/42?language=fr-FR',
        {
          headers: {
            Authorization: 'Bearer test-access-token',
            'Content-Type': 'application/json;charset=utf-8',
          },
        },
      );
      expect(responseJson).toHaveBeenCalledWith({
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
  });
});

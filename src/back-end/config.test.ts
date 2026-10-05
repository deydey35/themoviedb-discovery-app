import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('dotenv', () => ({
  default: {
    config: vi.fn(),
  },
}));

describe('configuration', () => {
  const originalToken = process.env.TMDB_ACCESS_TOKEN;

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env.TMDB_ACCESS_TOKEN;
    } else {
      process.env.TMDB_ACCESS_TOKEN = originalToken;
    }
    vi.resetModules();
  });

  it('throws when the TMDB access token is missing', async () => {
    delete process.env.TMDB_ACCESS_TOKEN;

    await expect(import('./config')).rejects.toThrow(
      'TMDB_ACCESS_TOKEN is not defined in the environment variables.',
    );
  });

  it('exports the configured TMDB access token', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'test-access-token';

    await expect(import('./config')).resolves.toMatchObject({
      tmdbAccessToken: 'test-access-token',
    });
  });
});

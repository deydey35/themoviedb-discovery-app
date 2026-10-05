import { describe, expect, it, vi } from 'vitest';
import { registerHealthApi } from './health-api';

describe('health API', () => {
  it('registers a route that returns an ok status', () => {
    const get = vi.fn();
    const response = { json: vi.fn() };

    registerHealthApi({ get } as never);
    const handler = get.mock.calls[0]?.[1] as (
      request: unknown,
      response: { json: ReturnType<typeof vi.fn> },
    ) => void;

    handler({}, response);

    expect(get).toHaveBeenCalledWith('/api/health', expect.any(Function));
    expect(response.json).toHaveBeenCalledWith({ status: 'ok' });
  });
});

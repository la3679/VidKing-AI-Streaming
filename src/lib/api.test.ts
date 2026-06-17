import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { chat, ApiError } from './api';

function mockFetch(impl: (url: string, init?: RequestInit) => Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn(impl) as unknown as typeof fetch);
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe('api.chat', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it('posts to /api/ai/chat and returns the reply', async () => {
    let calledUrl = '';
    let calledBody: any = null;
    mockFetch(async (url, init) => {
      calledUrl = url;
      calledBody = JSON.parse(String(init?.body));
      return jsonResponse({ reply: 'Try Arrival (2016).' });
    });

    const res = await chat([{ role: 'user', content: 'sci-fi please' }], 'Alex');
    expect(res.reply).toBe('Try Arrival (2016).');
    expect(calledUrl).toContain('/api/ai/chat');
    expect(calledBody.messages[0].content).toBe('sci-fi please');
    expect(calledBody.userName).toBe('Alex');
  });

  it('maps a 503 to an ApiError flagged unavailable', async () => {
    mockFetch(async () =>
      jsonResponse({ error: { message: 'AI is not configured.', code: 'ai_unavailable' } }, 503),
    );
    const err = await chat([{ role: 'user', content: 'hi' }]).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(503);
    expect((err as ApiError).isUnavailable).toBe(true);
  });

  it('maps a network failure to a network_error ApiError', async () => {
    mockFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    const err = await chat([{ role: 'user', content: 'hi' }]).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe('network_error');
  });

  it('surfaces a validation error message from the server envelope', async () => {
    mockFetch(async () =>
      jsonResponse({ error: { message: 'Invalid request payload.', code: 'invalid_request' } }, 400),
    );
    const err = await chat([{ role: 'user', content: 'hi' }]).catch((e) => e);
    expect((err as ApiError).status).toBe(400);
    expect((err as ApiError).message).toBe('Invalid request payload.');
  });
});

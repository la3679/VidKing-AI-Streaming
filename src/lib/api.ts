/**
 * Typed client for the VidKing backend API. All AI calls go through here so the
 * Gemini key stays server-side. In dev, requests hit same-origin `/api` and are
 * proxied to the Express server by Vite; in production they hit the Vercel
 * serverless function at `/api`.
 */
import { env } from './env';

const BASE = env.apiBaseUrl; // '' => same origin

export class ApiError extends Error {
  status: number;
  code: string | null;
  constructor(message: string, status: number, code: string | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
  /** True when the backend reports AI is not configured/available. */
  get isUnavailable() {
    return this.status === 503 || this.code === 'ai_unavailable';
  }
}

async function postJson<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError('Could not reach the server.', 0, 'network_error');
  }

  const data = (await res.json().catch(() => null)) as
    | { error?: { message?: string; code?: string } }
    | (T & { error?: undefined })
    | null;

  if (!res.ok) {
    const err = (data as { error?: { message?: string; code?: string } } | null)?.error;
    throw new ApiError(err?.message ?? 'Request failed.', res.status, err?.code ?? null);
  }
  return data as T;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function chat(
  messages: ChatMessage[],
  userName?: string,
  signal?: AbortSignal,
): Promise<{ reply: string }> {
  return postJson('/ai/chat', { messages, userName }, signal);
}

export interface RankedResult {
  id: string;
  aiScore: number;
}

export function rank(
  candidates: unknown[],
  signals: unknown,
): Promise<{ ranked: RankedResult[] }> {
  return postJson('/ai/rank', { candidates, signals });
}

export async function health(): Promise<{ status: string; aiEnabled: boolean }> {
  const res = await fetch(`${BASE}/api/health`);
  return res.json();
}

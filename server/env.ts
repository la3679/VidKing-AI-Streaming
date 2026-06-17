/**
 * Server-side environment configuration and validation.
 *
 * Secrets (the Gemini API key in particular) live here and are NEVER bundled
 * into the client. Missing secrets degrade endpoints gracefully (503) rather
 * than crashing the process.
 */

function str(v: string | undefined, fallback = ''): string {
  return (v ?? fallback).trim();
}

const geminiApiKey = str(process.env.GEMINI_API_KEY);

export const serverEnv = {
  nodeEnv: str(process.env.NODE_ENV, 'development'),
  isProd: process.env.NODE_ENV === 'production',
  port: Number(str(process.env.PORT, '8787')),

  geminiApiKey,
  aiEnabled: Boolean(geminiApiKey),
  chatModel: str(process.env.GEMINI_CHAT_MODEL, 'gemini-2.5-flash'),
  embedModel: str(process.env.GEMINI_EMBED_MODEL, 'text-embedding-004'),

  /** Origins allowed to call the API (CORS). Comma-separated. */
  allowedOrigins: str(process.env.ALLOWED_ORIGINS, 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
} as const;

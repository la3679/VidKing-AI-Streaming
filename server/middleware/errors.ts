import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AiUnavailableError } from '../lib/gemini.js';
import { serverEnv } from '../env.js';

/** Consistent JSON error envelope: { error: { message, code } }. */
export function sendError(res: Response, status: number, message: string, code?: string) {
  res.status(status).json({ error: { message, code: code ?? null } });
}

/** 404 handler for unknown API routes. */
export function notFound(_req: Request, res: Response) {
  sendError(res, 404, 'Not found', 'not_found');
}

/**
 * Central error handler. Never leaks stack traces to clients in production;
 * logs server-side with enough context to debug.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return sendError(res, 400, 'Invalid request payload.', 'invalid_request');
  }
  if (err instanceof AiUnavailableError) {
    return sendError(res, 503, err.message, 'ai_unavailable');
  }

  // eslint-disable-next-line no-console
  console.error('[server] Unhandled error:', err);
  const message = serverEnv.isProd
    ? 'An unexpected server error occurred.'
    : err instanceof Error
      ? err.message
      : String(err);
  return sendError(res, 500, message, 'internal_error');
}

/** Wraps an async route handler so rejections reach the error middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

/**
 * Vercel serverless entry point. Vercel routes `/api/*` (see vercel.json) to
 * this single function, which delegates to the shared Express app.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../server/app.js';

const app = createApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}

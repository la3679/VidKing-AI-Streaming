/**
 * Vercel serverless entry point. This catch-all function (`api/[...path].ts`)
 * receives every `/api/*` request automatically — no rewrite needed — and
 * delegates to the shared Express app, which does the routing.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../server/app.js';

const app = createApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}

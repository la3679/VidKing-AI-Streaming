import express, { type Express } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { serverEnv } from './env.js';
import { aiRouter } from './routes/ai.js';
import { healthRouter } from './routes/health.js';
import { errorHandler, notFound } from './middleware/errors.js';

/** Builds the Express app (used by both the standalone server and Vercel). */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1); // correct client IPs behind Vercel/proxies for rate limiting

  // CORS: allow configured origins; allow same-origin / tools (no Origin header).
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || serverEnv.allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error('Not allowed by CORS'));
      },
    }),
  );

  app.use(express.json({ limit: '256kb' }));

  // Lightweight request log (method, path, status, ms) — no bodies, no secrets.
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      // eslint-disable-next-line no-console
      console.log(`[server] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
    });
    next();
  });

  // Basic abuse protection on the AI endpoints (most expensive).
  const aiLimiter = rateLimit({
    windowMs: 60_000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { message: 'Too many requests. Please slow down.', code: 'rate_limited' } },
  });

  app.use('/api', healthRouter);
  app.use('/api/ai', aiLimiter, aiRouter);

  app.use('/api', notFound);
  app.use(errorHandler);

  return app;
}

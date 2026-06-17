import { Router } from 'express';
import { serverEnv } from '../env.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', aiEnabled: serverEnv.aiEnabled, time: new Date().toISOString() });
});

// Dev-only diagnostics: surfaces non-secret config to aid local debugging.
healthRouter.get('/diagnostics', (_req, res) => {
  if (serverEnv.isProd) {
    return res.status(404).json({ error: { message: 'Not found', code: 'not_found' } });
  }
  res.json({
    nodeEnv: serverEnv.nodeEnv,
    aiEnabled: serverEnv.aiEnabled,
    chatModel: serverEnv.chatModel,
    embedModel: serverEnv.embedModel,
    allowedOrigins: serverEnv.allowedOrigins,
  });
});

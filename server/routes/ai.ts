import { Router } from 'express';
import { z } from 'zod';
import { chat } from '../lib/gemini.js';
import { rankCandidates } from '../lib/ranking.js';
import { asyncHandler } from '../middleware/errors.js';

export const aiRouter = Router();

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(30),
  userName: z.string().max(80).optional(),
});

aiRouter.post(
  '/chat',
  asyncHandler(async (req, res) => {
    const { messages, userName } = chatSchema.parse(req.body);
    const reply = await chat(messages, userName);
    res.json({ reply });
  }),
);

const rankSchema = z.object({
  candidates: z
    .array(
      z.object({
        id: z.union([z.number(), z.string()]),
        title: z.string().optional(),
        name: z.string().optional(),
        overview: z.string().optional(),
        genre_ids: z.array(z.number()).optional(),
      }),
    )
    .max(60),
  signals: z
    .object({
      history: z.array(z.any()).optional(),
      watchlist: z.array(z.any()).optional(),
      interactions: z.array(z.any()).optional(),
      lastQuery: z.string().max(200).optional(),
    })
    .default({}),
});

aiRouter.post(
  '/rank',
  asyncHandler(async (req, res) => {
    const { candidates, signals } = rankSchema.parse(req.body);
    const ranked = await rankCandidates(candidates, signals);
    res.json({ ranked });
  }),
);

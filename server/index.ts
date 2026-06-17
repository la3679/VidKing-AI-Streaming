import './load-env.js'; // must be first: populates process.env before env.ts reads it
import { createApp } from './app.js';
import { serverEnv } from './env.js';

const app = createApp();

app.listen(serverEnv.port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[server] VidKing API listening on http://localhost:${serverEnv.port} ` +
      `(AI ${serverEnv.aiEnabled ? 'enabled' : 'DISABLED — set GEMINI_API_KEY'})`,
  );
});

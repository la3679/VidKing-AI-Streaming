// Side-effect module: loads local env files BEFORE any module that reads
// process.env (e.g. env.ts) is evaluated. ESM runs imported modules in order,
// so this must be the first import in the dev server entry point.
// On Vercel this is a no-op (no files); config comes from the platform.
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' }); // developer overrides take precedence
dotenv.config(); // .env fallback (dotenv never overrides already-set vars)

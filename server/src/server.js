import 'dotenv/config';
import { env, validateConfig } from './config/env.js';
import { createApp } from './app.js';
import { pool, verifyDatabase } from './config/db.js';
import { purgeExpired } from './services/cleanup.service.js';

process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e));
process.on('uncaughtException', (e) => console.error('[uncaughtException]', e));

async function main() {
  try {
    validateConfig();
  } catch (err) {
    console.error(`[startup] ${err.message}`);
    process.exit(1);
  }

  try {
    await verifyDatabase();
    console.log();
  } catch (err) {
    console.error(`[db] Could not connect to database: ${err.code || err.message}`);
    process.exit(1);
  }

  // 24-hour auto-delete: purge once at start, then hourly (long-lived process only).
  await purgeExpired();
  if (!process.env.VERCEL) {
    setInterval(() => purgeExpired(), 60 * 60 * 1000);
  }

  const app = createApp();

  // Long-lived local process only. Inside a Vercel Serverless Function this
  // file is never imported directly: the framework calls the exported handler.
  if (process.env.VERCEL !== '1' && process.env.IS_VERCEL_VERCEL_FUNCTION !== '1') {
    const { createServer } = await import('http');
    const server = createServer(app);
    const port = env.PORT || 5000;
    await new Promise((resolve) => server.listen(port, resolve));
    const shutdown = async () => {
      await new Promise((resolve) => server.close(resolve));
      await pool.end().catch(() => {});
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    console.log(`[server] DebugMyCV API listening on http://localhost:${port} (${env.NODE_ENV})`);
    console.log(`[server] Timezone: ${env.APP_TIMEZONE} | AI: ${env.AI_ENABLED && env.GROQ_API_KEY ? 'configured' : 'not configured'}`);
  }
}

main().catch((err) => {
  console.error('[startup]', err?.stack || err);
  process.exit(1);
});

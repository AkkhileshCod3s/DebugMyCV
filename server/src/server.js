import { createApp } from './app.js';
import { env, validateConfig } from './config/env.js';
import { pool, verifyDatabase } from './config/db.js';

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
    console.error(
      `[db] Could not connect to database (${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}): ${err.code || err.message}`,
    );
    console.error('[db] Check DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD in .env and run scripts/db-setup.mjs.');
    process.exit(1);
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

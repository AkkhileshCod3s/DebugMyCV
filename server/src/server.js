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
    console.log(`[db] Connected to MySQL at ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
  } catch (err) {
    console.error(
      `[db] Could not connect to MySQL (${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}): ${err.code || err.message}`,
    );
    console.error('[db] Check DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD in .env and run database/schema.sql.');
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`[server] CareerLens AI API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
    console.log(`[server] Timezone: ${env.APP_TIMEZONE} | AI: ${env.AI_ENABLED && env.GROQ_API_KEY ? 'configured' : 'not configured'}`);
  });

  const shutdown = async () => {
    server.close();
    await pool.end().catch(() => {});
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[startup]', err?.stack || err);
  process.exit(1);
});

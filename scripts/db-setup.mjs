/* ─────────────────────────────────────────────────────────────────────────────
   DebugMyCV — Postgres schema setup script (Supabase-compatible)
   Safe to run twice: the schema file is idempotent (CREATE TABLE IF NOT EXISTS).
   Reads DATABASE_URL from the environment and connects through the `pg` driver.
   Usage:  DATABASE_URL="postgres://..." node scripts/db-setup.mjs
   ───────────────────────────────────────────────────────────────────────────── */

import 'dotenv/config';
import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('[db-setup] DATABASE_URL is required. Set it (Supabase pooled connection string).');
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();

  // Start a transaction for everything that follows (create db is not allowed
  // inside a transaction, so we run it separately, then re-connect inside the tx).
  const session = await client.query('BEGIN');

  // 1. Create the database if it does not exist.
  const dbExists = await client.query(
    `SELECT 1 FROM pg_database WHERE datname = 'careerlens_ai'`,
  );
  if (dbExists.rowCount === 0) {
    await client.query('CREATE DATABASE careerlens_ai');
    console.log('[db-setup] Database careerlens_ai created.');
  } else {
    console.log('[db-setup] Database careerlens_ai already exists.');
  }

  // 2. Connect to careerlens_ai and apply the schema.
  const schema = new Client({
    connectionString: DATABASE_URL.replace(/^postgres/, 'postgres') + '/careerlens_ai',
    ssl: { rejectUnauthorized: false },
  });
  await schema.connect();

  const sql = await schema.query(
    fs.readFileSync(new URL('../database/schema.sql', import.meta.url), 'utf8'),
  );
  console.log('[db-setup] Schema applied.');

  await schema.query('COMMIT');
  await schema.end();

  // 3. Idle-check the pooled connection works.
  const idleCheck = await client.query('SELECT 1 AS ok');
  console.log('[db-setup] Database check:', idleCheck.rows[0].ok);

  console.log('[db-setup] Schema applied successfully.');
} catch (err) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('[db-setup] Failed:', err.message);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}

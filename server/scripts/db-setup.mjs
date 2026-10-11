/* DebugMyCV — Postgres schema setup (Supabase). Safe to run twice. */
import 'dotenv/config';
import fs from 'node:fs';
import { Client } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('[db-setup] DATABASE_URL is required. Set it in server/.env (Supabase pooled connection string).');
  process.exit(1);
}

const candidates = [
  new URL('../../database/schema.sql', import.meta.url),
  new URL('../database/schema.sql', import.meta.url),
];
const schemaUrl = candidates.find((u) => fs.existsSync(u));
if (!schemaUrl) {
  console.error('[db-setup] Could not find database/schema.sql');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(fs.readFileSync(schemaUrl, 'utf8'));
  console.log('[db-setup] Schema applied successfully.');
} catch (err) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('[db-setup] Failed:', err.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
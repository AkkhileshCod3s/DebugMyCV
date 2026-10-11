import 'dotenv/config';
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase requires SSL
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Idle clients can be terminated by the server (ECONNRESET); without this
// handler an 'error' event on an idle client would crash the process.
pool.on('error', (err) => {
  console.error('[pg pool error]', err.message);
});

// Postgres returns TIMESTAMPTZ as proper Date (UTC-aware). No connection-level
// time_zone override is needed.

export async function verifyDatabase() {
  const res = await pool.query('SELECT 1 AS ok');
  return res.rows[0].ok;
}

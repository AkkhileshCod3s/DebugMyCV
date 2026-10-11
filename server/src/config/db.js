import pg from 'pg';
import { env } from './env.js';

export const { Pool } = pg;

export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 3, // Supabase pooled connection limit (1-3)
  ssl: { rejectUnauthorized: false }, // Supabase requires SSL
  connectionTimeoutMillis: 5000,
});

// Postgres returns TIMESTAMPTZ as proper Date (UTC-aware). No connection-level
// time_zone override is needed.

export async function verifyDatabase() {
  const res = await pool.query('SELECT 1 AS ok');
  return res.rows[0].ok;
}

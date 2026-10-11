import { pool } from '../config/db.js';
import { env, todayKey } from '../config/env.js';
import { tooMany } from '../utils/errors.js';

/** Daily quota accounting backed by Postgres (Supabase).
 *
 * Policy:
 *  - Counters are incremented with an atomic conditional UPDATE
 *    (`... WHERE count < max`), so concurrent requests can never exceed the
 *    configured maximum: at most one request wins each slot.
 *  - Slots are RESERVED before an expensive operation (file processing / AI
 *    call) and RELEASED if that operation fails, so failed requests never
 *    consume quota and successful ones are always counted exactly once.
 */

async function ensureRow(userId, date) {
  await pool.query(
    'INSERT INTO daily_usage (user_id, usage_date, successful_resume_upload_count, ai_analysis_count) ' +
      'VALUES ($1, $2, 0, 0) ' +
      'ON CONFLICT (user_id, usage_date) DO NOTHING',
    [userId, date],
  );
}

/** Atomically reserves one slot. Returns true when granted, false when exhausted. */
export async function reserveSlot(userId, kind, max) {
  const date = todayKey();
  const column = kind === 'uploads' ? 'successful_resume_upload_count' : 'ai_analysis_count';
  const conn = await pool.connect();
  try {
    await conn.query('BEGIN');
    await ensureRow(userId, date, conn);
    const result = await conn.query(
      'UPDATE daily_usage SET "' + column + '" = "' + column + '" + 1 ' +
        'WHERE user_id = $1 AND usage_date = $2 AND "' + column + '" < $3 ' +
        'RETURNING "' + column + '" AS new_count',
      [userId, date, max],
    );
    await conn.query('COMMIT');
    return result.rows.length === 1 && Number(result.rows[0].new_count) >= 1;
  } catch (err) {
    await conn.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

/** Returns a previously reserved slot after a failed operation. */
export async function releaseSlot(userId, kind) {
  const date = todayKey();
  const column = kind === 'uploads' ? 'successful_resume_upload_count' : 'ai_analysis_count';
  await pool.query(
    'UPDATE daily_usage SET "' + column + '" = GREATEST("' + column + '" - 1, 0) ' +
      'WHERE user_id = $1 AND usage_date = $2',
    [userId, date],
  );
}

/** Reserves a slot or throws HTTP 429 with a clear message. */
export async function reserveOrFail(userId, kind) {
  const max = kind === 'uploads' ? env.MAX_RESUME_UPLOADS_PER_DAY : env.MAX_ANALYSES_PER_DAY;
  const granted = await reserveSlot(userId, kind, max);
  if (!granted) {
    throw tooMany(
      kind === 'uploads'
        ? `Daily resume upload limit reached (${max} per day). Please try again tomorrow.`
        : `Daily AI analysis limit reached (${max} per day). Please try again tomorrow.`,
    );
  }
}

export async function getDailyUsage(userId) {
  const date = todayKey();
  const res = await pool.query(
    'SELECT successful_resume_upload_count, ai_analysis_count ' +
      'FROM daily_usage WHERE user_id = $1 AND usage_date = $2',
    [userId, date],
  );
  const row = res.rows[0] || { successful_resume_upload_count: 0, ai_analysis_count: 0 };
  const uploadsUsed = Math.min(Number(row.successful_resume_upload_count), env.MAX_RESUME_UPLOADS_PER_DAY);
  const analysesUsed = Math.min(Number(row.ai_analysis_count), env.MAX_ANALYSES_PER_DAY);
  return {
    date,
    timezone: env.APP_TIMEZONE,
    uploads: {
      used: uploadsUsed,
      max: env.MAX_RESUME_UPLOADS_PER_DAY,
      remaining: Math.max(env.MAX_RESUME_UPLOADS_PER_DAY - uploadsUsed, 0),
    },
    analyses: {
      used: analysesUsed,
      max: env.MAX_ANALYSES_PER_DAY,
      remaining: Math.max(env.MAX_ANALYSES_PER_DAY - analysesUsed, 0),
    },
  };
}

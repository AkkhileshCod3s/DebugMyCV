import 'dotenv/config';
import crypto from 'node:crypto';

const int = (value, fallback) => {
  const n = Number.parseInt(value ?? '', 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const bool = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  return !['false', '0', 'no', 'off'].includes(String(value).toLowerCase());
};

export const env = {
  PORT: int(process.env.PORT, 5000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: int(process.env.DB_PORT, 5432),
  DB_NAME: process.env.DB_NAME || 'careerlens_ai',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD ?? '',
  DB_POOL_SIZE: int(process.env.DB_POOL_SIZE, 3),

  SESSION_SECRET: process.env.SESSION_SECRET || '',
  JWT_SECRET: process.env.JWT_SECRET || '',

  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',

  MAX_RESUME_UPLOADS_PER_DAY: int(process.env.MAX_RESUME_UPLOADS_PER_DAY, 5),
  MAX_ANALYSES_PER_DAY: int(process.env.MAX_ANALYSES_PER_DAY, 10),
  MAX_RESUME_FILE_SIZE_MB: int(process.env.MAX_RESUME_FILE_SIZE_MB, 4),
  MAX_INPUT_CHARACTERS: int(process.env.MAX_INPUT_CHARACTERS, 20000),
  MAX_OUTPUT_TOKENS: int(process.env.MAX_OUTPUT_TOKENS, 2500),

  AI_ENABLED: bool(process.env.AI_ENABLED, true),
  APP_TIMEZONE: process.env.APP_TIMEZONE || 'Asia/Kolkata',
};

if (!env.SESSION_SECRET) {
  // Development-only fallback; sessions restart when the server restarts.
  env.SESSION_SECRET = crypto.randomBytes(48).toString('hex');
  if (env.NODE_ENV !== 'production') {
    console.warn('[config] SESSION_SECRET not set — generated an ephemeral development secret.');
  }
}

if (!env.JWT_SECRET && env.NODE_ENV !== 'production') {
  env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
}

/** Fails fast on missing/invalid production configuration. Never prints secret values. */
export function validateConfig() {
  const problems = [];

  if (env.NODE_ENV === 'production') {
    if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
      problems.push('SESSION_SECRET must be set to at least 32 characters in production');
    }
    if (!env.JWT_SECRET) {
      problems.push('JWT_SECRET must be set in production');
    }
    if (!env.DB_USER) problems.push('DB_USER is required in production');
    if (!env.DB_PASSWORD) problems.push('DB_PASSWORD is required in production');
    if (!env.GROQ_API_KEY) problems.push('GROQ_API_KEY is required in production when AI_ENABLED=true');
  }

  if (env.AI_ENABLED && !env.GROQ_API_KEY) {
    console.warn('[config] GROQ_API_KEY is not set — AI analysis endpoints will return a configuration error.');
  }

  if (problems.length) {
    const error = new Error(`Invalid configuration: ${problems.join('; ')}`);
    error.config = true;
    throw error;
  }
}

/** Current calendar date in the application timezone (default Asia/Kolkata). */
export function todayKey(timezone = env.APP_TIMEZONE) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

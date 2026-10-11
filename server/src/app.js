import 'express-async-errors';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import { Pool } from 'pg';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import { originCheck } from './middleware/auth.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import jobRoutes from './routes/job.routes.js';
import analysisRoutes from './routes/analysis.routes.js';
import usageRoutes, { profileRouter } from './routes/usage.routes.js';

import { purgeExpired } from './services/cleanup.service.js';

// Postgres session store backed by the same pooled connection.
const SessionStore = session.Store;
export class PgSessionStore extends SessionStore {
  constructor(opts) {
    super(opts);
    this.pool = opts.pool;
    this.tableName = opts.tableName || 'sessions';
  }
  async get(sid, callback) {
    try {
      const res = await this.pool.query(
        'SELECT session_id, expires, data FROM ' + this.tableName + ' WHERE session_id = $1',
        [sid],
      );
      if (res.rows.length === 0) return callback();
      const row = res.rows[0];
      // `expires` is epoch milliseconds (BIGINT); expired rows read as no session.
      if (!row.data || Number(row.expires) <= Date.now()) return callback();
      let sess;
      try {
        sess = JSON.parse(row.data);
      } catch {
        return callback();
      }
      if (!sess || !sess.cookie) return callback();
      // Hand the stored session (including its cookie) to express-session.
      callback(null, sess);
    } catch (err) {
      callback(err);
    }
  }
  async set(sid, session, callback) {
    try {
      const maxAge = Number.isFinite(session.cookie?.maxAge)
        ? session.cookie.maxAge
        : 7 * 24 * 60 * 60 * 1000;
      const expires = Date.now() + maxAge;
      const data = JSON.stringify(session);
      await this.pool.query(
        'INSERT INTO ' + this.tableName + ' (session_id, expires, data) VALUES ($1, $2, $3) ' +
          'ON CONFLICT (session_id) DO UPDATE SET expires = $2, data = $3',
        [sid, expires, data],
      );
      callback();
    } catch (err) {
      callback(err);
    }
  }
  async destroy(sid, callback) {
    try {
      await this.pool.query('DELETE FROM ' + this.tableName + ' WHERE session_id = $1', [sid]);
      callback();
    } catch (err) {
      callback(err);
    }
  }
}

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:'],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'", ...env.FRONTEND_URL.split(',').map((u) => u.trim())],
          frameAncestors: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );

  app.use(
    cors({
      origin: env.FRONTEND_URL.split(',').map((u) => u.trim()),
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );

  app.use(express.json({ limit: '256kb' }));
  app.use(express.urlencoded({ extended: false, limit: '64kb' }));
  app.use(generalLimiter);
  app.use(originCheck);

  app.use(
    session({
      name: 'careerlens.sid',
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: new PgSessionStore({ pool, tableName: 'sessions' }),
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      },
    }),
  );

  app.get('/api/health', async (_req, res) => {
    let dbOk = false;
    try {
      const d = await pool.query('SELECT 1 AS ok');
      dbOk = d.rows[0]?.ok === 1;
    } catch {
      dbOk = false;
    }
    res.json({
      success: true,
      status: 'ok',
      dbOk,
      aiConfigured: Boolean(env.AI_ENABLED && env.GROQ_API_KEY),
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/resumes', resumeRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/analyses', analysisRoutes);
  app.use('/api/analyze', analysisRoutes);
  app.use('/api/usage', usageRoutes);
  app.use('/api/profile', profileRouter);

  // Vercel cron: purge expired data (requires CRON_SECRET bearer token).
  app.get('/api/cron/purge', async (req, res) => {
    const secret = process.env.CRON_SECRET;
    const auth = req.get('authorization') || '';
    if (!secret || auth !== `Bearer ${secret}`) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }
    const counts = await purgeExpired();
    res.json({ success: true, purged: counts });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  // Catch-all: nothing escapes the error pipeline and takes the process down.
  app.use((err, req, res, next) => {
    console.error('[route error]', req.method, req.originalUrl, err);
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  });

  return app;
}

// ---------------------------------------------------------------------------
// Vercel Serverless-compatible export
// ---------------------------------------------------------------------------
// When this module is executed as a Vercel Serverless Function the first
// `require()`/`import()` of the module is the actual function entry point.
// We only listen on port + http.createServer() when running as a long-lived
// local process, never when Vercel invokes the function.
export const app = createApp();

export default app;



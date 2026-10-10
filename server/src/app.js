import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
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

const MySQLStore = MySQLStoreFactory(session);

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
      store: new MySQLStore({
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        createDatabaseTable: true,
        schema: {
          tableName: 'sessions',
          columnNames: { session_id: 'session_id', expires: 'expires', data: 'data' },
        },
      }),
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      },
    }),
  );

  app.get('/api/health', (_req, res) =>
    res.json({ success: true, status: 'ok', aiConfigured: Boolean(env.AI_ENABLED && env.GROQ_API_KEY) }),
  );

  app.use('/api/auth', authRoutes);
  app.use('/api/resumes', resumeRoutes);
  app.use('/api/jobs', jobRoutes);
  app.use('/api/analyses', analysisRoutes);
  app.use('/api/analyze', analysisRoutes);
  app.use('/api/usage', usageRoutes);
  app.use('/api/profile', profileRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

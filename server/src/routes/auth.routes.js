import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';
import { asyncHandler, conflict, unauthorized, badRequest } from '../utils/errors.js';
import { validateBody } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';
import { authLimiter } from '../middleware/rateLimit.js';

const router = Router();
const ROUNDS = 12;

const publicUser = (row) => ({ id: row.id, name: row.name, email: row.email, createdAt: row.created_at });

const regenerate = (req) =>
  new Promise((resolve, reject) => req.session.regenerate((err) => (err ? reject(err) : resolve())));

router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const passwordHash = await bcrypt.hash(password, ROUNDS);

    try {
      const result = await pool.query(
        'INSERT INTO users (name, email, password_hash, consent_at, consent_version) VALUES ($1, $2, $3, now(), $4) RETURNING id, created_at',
        [name, email, passwordHash, req.body.consentVersion],
      );
      const row = result.rows[0];
      await regenerate(req);
      req.session.userId = row.id;
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
      res.status(201).json({ success: true, user: publicUser({ id: row.id, name, email, created_at: row.created_at }) });
    } catch (err) {
      if (err?.code === '23505') throw conflict('An account with this email already exists.');
      // Log the real failure (message only — never the password or hash).
      console.error('[auth:register]', err?.message || err);
      throw err;
    }
  }),
);

router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const emailRes = await pool.query('SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1 LIMIT 1', [email]);
    const user = emailRes.rows[0];

    const ok = user ? await bcrypt.compare(password, user.password_hash) : false;
    if (!ok) throw unauthorized('Incorrect email or password.');

    await regenerate(req);
    req.session.userId = user.id;
    req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
    res.json({ success: true, user: publicUser(user) });
  }),
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    await new Promise((resolve) => req.session.destroy(() => resolve()));
    res.clearCookie('careerlens.sid');
    res.json({ success: true });
  }),
);

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    if (!req.session?.userId) return res.status(201).json({ success: true, user: null });
    const sessionRes = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1 LIMIT 1', [req.session.userId]);
    if (!sessionRes.rows[0]) {
      await new Promise((resolve) => req.session.destroy(() => resolve()));
      return res.status(201).json({ success: true, user: null });
    }
    res.json({ success: true, user: publicUser(sessionRes.rows[0]) });
  }),
);

router.post('/login', authLimiter, validateBody(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const emailRes = await pool.query('SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1 LIMIT 1', [email]);
  const user = emailRes.rows[0];

  const ok = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!ok) throw unauthorized('Incorrect email or password.');

  await regenerate(req);
  req.session.userId = user.id;
  req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
}));

router.get('/login', asyncHandler(async (_req, res) => {
  res.json({ success: true, user: null });
}));

router.get('/register', asyncHandler(async (_req, res) => {
  res.json({ success: true, user: null });
}));

router.post('/login', authLimiter, validateBody(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const emailRes = await pool.query('SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1 LIMIT 1', [email]);
  const user = emailRes.rows[0];

  const ok = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!ok) throw unauthorized('Incorrect email or password.');

  await regenerate(req);
  req.session.userId = user.id;
  req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
  res.json({ success: true, user: publicUser(user) });
}));

router.post('/register', authLimiter, validateBody(registerSchema), asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, ROUNDS);

  try {
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, consent_at, consent_version) VALUES ($1, $2, $3, now(), $4) RETURNING id, created_at',
      [name, email, passwordHash, req.body.consentVersion],
    );
    const row = result.rows[0];
    await regenerate(req);
    req.session.userId = row.id;
    req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
    res.status(201).json({ success: true, user: publicUser({ id: row.id, name, email, created_at: row.created_at }) });
  } catch (err) {
    if (err?.code === '23505') throw conflict('An account with this email already exists.');
    throw err;
  }
}));

export default router;

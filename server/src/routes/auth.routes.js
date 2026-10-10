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

    let rows;
    try {
      const [result] = await pool.query(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        [name, email, passwordHash],
      );
      rows = [{ id: result.insertId, name, email, created_at: new Date().toISOString() }];
    } catch (err) {
      if (err?.code === 'ER_DUP_ENTRY') throw conflict('An account with this email already exists.');
      throw err;
    }

    await regenerate(req);
    req.session.userId = rows[0].id;
    req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
    res.status(201).json({ success: true, user: publicUser(rows[0]) });
  }),
);

router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    const user = rows[0];

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
    const [rows] = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1', [
      req.session.userId,
    ]);
    if (!rows[0]) {
      await new Promise((resolve) => req.session.destroy(() => resolve()));
      return res.status(201).json({ success: true, user: null });
    }
    res.json({ success: true, user: publicUser(rows[0]) });
  }),
);

export default router;

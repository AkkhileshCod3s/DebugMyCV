import { Router } from 'express';
import { pool } from '../config/db.js';
import { asyncHandler, badRequest, unauthorized, notFound } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { profileSchema } from '../validators/schemas.js';
import { getDailyUsage } from '../services/usage.service.js';
import { authLimiter } from '../middleware/rateLimit.js';
import bcrypt from 'bcrypt';

const router = Router();

// ── GET /api/usage/daily ────────────────────────────────────────────────────
router.get(
  '/daily',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ success: true, usage: await getDailyUsage(req.userId) });
  }),
);

// ── GET /api/profile ────────────────────────────────────────────────────────
export const profileRouter = Router();
profileRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1', [
      req.userId,
    ]);
    if (!rows[0]) throw notFound('Account not found.');
    const u = rows[0];
    res.json({
      success: true,
      profile: { id: u.id, name: u.name, email: u.email, createdAt: u.created_at },
      usage: await getDailyUsage(req.userId),
    });
  }),
);

profileRouter.patch(
  '/',
  requireAuth,
  authLimiter,
  validateBody(profileSchema),
  asyncHandler(async (req, res) => {
    const { name, currentPassword, newPassword } = req.body;
    const [rows] = await pool.query('SELECT id, name, email, password_hash, created_at FROM users WHERE id = ? LIMIT 1', [
      req.userId,
    ]);
    if (!rows[0]) throw notFound('Account not found.');
    const user = rows[0];

    if (newPassword) {
      if (!currentPassword) throw badRequest('Enter your current password to set a new one.');
      const ok = await bcrypt.compare(currentPassword, user.password_hash);
      if (!ok) throw unauthorized('Current password is incorrect.');
      const hash = await bcrypt.hash(newPassword, 12);
      await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.userId]);
      // Password change invalidates other sessions (this one stays active).
      req.session.passwordChangedAt = Date.now();
    }
    if (name) {
      await pool.query('UPDATE users SET name = ? WHERE id = ?', [name, req.userId]);
    }

    res.json({
      success: true,
      profile: {
        id: user.id,
        name: name || user.name,
        email: user.email,
        createdAt: user.created_at,
      },
    });
  }),
);

export default router;

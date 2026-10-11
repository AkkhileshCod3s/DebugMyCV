import { unauthorized, forbidden } from '../utils/errors.js';
import { env } from '../config/env.js';

export function requireAuth(req, _res, next) {
  if (!req.session?.userId) return next(unauthorized('Please sign in to continue.'));
  req.userId = req.session.userId;
  next();
}

/**
 * Origin check for state-changing requests (CSRF hardening alongside
 * SameSite=Lax session cookies and same-origin Vite proxying).
 */
export function originCheck(req, _res, next) {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();

  const origin = req.headers.origin;
  if (!origin) return next();

  // Keep in sync with the CORS origin list in app.js (comma-separated FRONTEND_URL).
  const allowed = new Set([
    ...env.FRONTEND_URL.split(',').map((u) => u.trim()).filter(Boolean),
    `http://localhost:${process.env.CLIENT_PORT || 5173}`,
    `http://127.0.0.1:${process.env.CLIENT_PORT || 5173}`,
  ]);
  if (allowed.has(origin)) return next();
  return next(forbidden('Request origin is not allowed.'));
}

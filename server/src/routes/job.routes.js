import { Router } from 'express';
import { pool } from '../config/db.js';
import { asyncHandler, notFound } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { jobSchema, idParamSchema } from '../validators/schemas.js';

const router = Router();
router.use(requireAuth);

const jobRow = (j) => ({
  id: j.id,
  label: j.label,
  descriptionText: j.description_text,
  createdAt: j.created_at,
});
const jobSummary = (j) => ({ id: j.id, label: j.label, createdAt: j.created_at });

router.post(
  '/',
  validateBody(jobSchema),
  asyncHandler(async (req, res) => {
    const { label, descriptionText } = req.body;
    const [result] = await pool.query(
      'INSERT INTO job_descriptions (user_id, label, description_text) VALUES (?, ?, ?)',
      [req.userId, label, descriptionText],
    );
    res.status(201).json({
      success: true,
      job: { id: result.insertId, label, descriptionText, createdAt: new Date().toISOString() },
    });
  }),
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      'SELECT id, label, created_at FROM job_descriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
      [req.userId],
    );
    res.json({ success: true, jobs: rows.map(jobSummary) });
  }),
);

router.get(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM job_descriptions WHERE id = ? AND user_id = ? LIMIT 1', [
      req.params.id,
      req.userId,
    ]);
    if (!rows[0]) throw notFound('Job description not found.');
    res.json({ success: true, job: jobRow(rows[0]) });
  }),
);

router.delete(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const [result] = await pool.query('DELETE FROM job_descriptions WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.userId,
    ]);
    if (result.affectedRows === 0) throw notFound('Job description not found.');
    res.json({ success: true });
  }),
);

export default router;

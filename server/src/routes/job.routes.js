import { Router } from 'express';
import { pool } from '../config/db.js';
import { asyncHandler, notFound } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { jobSchema, idParamSchema } from '../validators/schemas.js';

const router = Router();
router.use(requireAuth);

router.post(
  '/',
  validateBody(jobSchema),
  asyncHandler(async (req, res) => {
    const { label, descriptionText } = req.body;
    const result = await pool.query(
      'INSERT INTO job_descriptions (user_id, label, description_text) VALUES ($1, $2, $3) RETURNING id',
      [req.userId, label, descriptionText],
    );
    res.status(201).json({
      success: true,
      job: { id: result.rows[0].id, label, descriptionText, createdAt: new Date().toISOString() },
    });
  }),
);

router.delete(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const deleteRes = await pool.query('DELETE FROM job_descriptions WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.userId]);
    if (deleteRes.rows.length === 0) throw notFound('Job description not found.');
    res.json({ success: true });
  }),
);

export default router;

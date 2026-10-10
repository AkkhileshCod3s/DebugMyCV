import { Router } from 'express';
import { pool } from '../config/db.js';
import { asyncHandler, notFound, badRequest, forbidden } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { analyzeSchema, idParamSchema } from '../validators/schemas.js';
import { matchResumeToJob, isAiConfigured } from '../services/groq.service.js';
import { computeMatchScore } from '../services/scoring.service.js';
import { reserveOrFail, releaseSlot } from '../services/usage.service.js';
import { analyzeLimiter } from '../middleware/rateLimit.js';

const router = Router();
router.use(requireAuth);

const serialize = (a) => ({
  id: a.id,
  resumeId: a.resume_id,
  jobDescriptionId: a.job_description_id,
  matchScore: a.match_score,
  modelName: a.model_name,
  status: a.status,
  createdAt: a.created_at,
  result: typeof a.result_json === 'string' ? JSON.parse(a.result_json) : a.result_json,
});

// ── POST /api/analyze ───────────────────────────────────────────────────────
router.post(
  '/',
  analyzeLimiter,
  validateBody(analyzeSchema),
  asyncHandler(async (req, res) => {
    if (!isAiConfigured()) {
      throw badRequest('AI analysis is not configured on this server. Set GROQ_API_KEY in the server .env file.');
    }

    const { resumeId, jobDescriptionId } = req.body;
    const [resumeRows] = await pool.query(
      'SELECT id, user_id, extracted_text FROM resumes WHERE id = ? AND user_id = ? LIMIT 1',
      [resumeId, req.userId],
    );
    const [jobRows] = await pool.query(
      'SELECT id, user_id, description_text FROM job_descriptions WHERE id = ? AND user_id = ? LIMIT 1',
      [jobDescriptionId, req.userId],
    );

    const resume = resumeRows[0];
    const job = jobRows[0];
    if (!resume) throw notFound('Resume not found.');
    if (!job) throw notFound('Job description not found.');
    if (Number(resume.user_id) !== Number(req.userId) || Number(job.user_id) !== Number(req.userId)) {
      throw forbidden('You do not have access to this resource.');
    }
    if (!resume.extracted_text || resume.extracted_text.trim().length < 50) {
      throw badRequest('This resume has no usable text. Re-upload it or paste the text.');
    }

    // Reserve AI quota before the expensive provider request; release on failure.
    await reserveOrFail(req.userId, 'analyses');
    let reserved = true;
    const release = async () => {
      if (reserved) {
        reserved = false;
        await releaseSlot(req.userId, 'analyses').catch(() => {});
      }
    };

    try {
      const { data, model } = await matchResumeToJob({
        resumeText: resume.extracted_text,
        jobText: job.description_text,
      });

      const matchScore = computeMatchScore(data);
      const payload = JSON.stringify({ ...data, scoreExplanation: data.scoreExplanation || '' });

      const [result] = await pool.query(
        `INSERT INTO analyses (user_id, resume_id, job_description_id, match_score, result_json, model_name, status)
         VALUES (?, ?, ?, ?, ?, ?, 'completed')`,
        [req.userId, resume.id, job.id, matchScore, payload, model],
      );

      reserved = false;
      res.status(201).json({
        success: true,
        analysis: {
          id: result.insertId,
          resumeId: resume.id,
          jobDescriptionId: job.id,
          matchScore,
          modelName: model,
          status: 'completed',
          createdAt: new Date().toISOString(),
          result: JSON.parse(payload),
        },
      });
    } catch (err) {
      await release();
      throw err;
    }
  }),
);

// ── GET /api/analyses ───────────────────────────────────────────────────────
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number.parseInt(req.query.page || '1', 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit || '20', 10) || 20));
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT a.id, a.resume_id, a.job_description_id, a.match_score, a.model_name, a.status, a.created_at,
              r.original_filename AS resume_name, j.label AS job_label
       FROM analyses a
       LEFT JOIN resumes r ON r.id = a.resume_id
       LEFT JOIN job_descriptions j ON j.id = a.job_description_id
       WHERE a.user_id = ?
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.userId, limit, offset],
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM analyses WHERE user_id = ?', [req.userId]);

    res.json({
      success: true,
      analyses: rows.map((a) => ({
        id: a.id,
        resumeId: a.resume_id,
        jobDescriptionId: a.job_description_id,
        resumeName: a.resume_name || 'Deleted resume',
        jobLabel: a.job_label || 'Deleted job description',
        matchScore: a.match_score,
        modelName: a.model_name,
        status: a.status,
        createdAt: a.created_at,
      })),
      pagination: { page, limit, total: Number(total) },
    });
  }),
);

// ── GET /api/analyses/:id ───────────────────────────────────────────────────
router.get(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT a.*, r.original_filename AS resume_name, j.label AS job_label
       FROM analyses a
       LEFT JOIN resumes r ON r.id = a.resume_id
       LEFT JOIN job_descriptions j ON j.id = a.job_description_id
       WHERE a.id = ? AND a.user_id = ? LIMIT 1`,
      [req.params.id, req.userId],
    );
    if (!rows[0]) throw notFound('Analysis not found.');
    const a = rows[0];
    res.json({
      success: true,
      analysis: {
        ...serialize(a),
        resumeName: a.resume_name || 'Deleted resume',
        jobLabel: a.job_label || 'Deleted job description',
      },
    });
  }),
);

// ── DELETE /api/analyses/:id ────────────────────────────────────────────────
router.delete(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const [result] = await pool.query('DELETE FROM analyses WHERE id = ? AND user_id = ?', [
      req.params.id,
      req.userId,
    ]);
    if (result.affectedRows === 0) throw notFound('Analysis not found.');
    res.json({ success: true });
  }),
);

export default router;

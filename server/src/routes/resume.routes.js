import { Router } from 'express';
import multer from 'multer';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { asyncHandler, badRequest, notFound } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { resumeTextSchema, idParamSchema } from '../validators/schemas.js';
import { validatePdfBuffer, extractPdfText } from '../services/pdf.service.js';
import { storeFile, deleteStoredFile, sha256 } from '../services/storage.service.js';
import { reserveOrFail, releaseSlot, getDailyUsage } from '../services/usage.service.js';
import { uploadLimiter } from '../middleware/rateLimit.js';

const router = Router();
router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_RESUME_FILE_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const mimeOk = ['application/pdf', 'application/octet-stream'].includes(file.mimetype);
    if (/\.pdf$/i.test(file.originalname) && mimeOk) return cb(null, true);
    cb(badRequest('Only PDF files are accepted.'));
  },
});

const resumeMeta = (r) => ({
  id: r.id,
  originalFilename: r.original_filename,
  fileSize: r.file_size,
  uploadedAt: r.uploaded_at,
  textLength: Number(r.text_length ?? (r.extracted_text ? r.extracted_text.length : 0)),
});

async function insertResume({ userId, originalFilename, storageIdentifier, text, fileSize, hash }) {
  const [result] = await pool.query(
    `INSERT INTO resumes (user_id, original_filename, storage_identifier, extracted_text, file_size, content_hash)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, originalFilename, storageIdentifier, text, fileSize, hash],
  );
  return result.insertId;
}

// ── POST /api/resumes/upload ────────────────────────────────────────────────
router.post(
  '/upload',
  uploadLimiter,
  (req, res, next) => upload.single('resume')(req, res, next),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) throw badRequest('Choose a PDF resume to upload.');
    validatePdfBuffer(file.buffer, file.originalname);

    // Quota is reserved only after the file passed size/type/signature checks.
    await reserveOrFail(req.userId, 'uploads');
    let reserved = true;
    const release = async () => {
      if (reserved) {
        reserved = false;
        await releaseSlot(req.userId, 'uploads').catch(() => {});
      }
    };

    let filePath = null;
    try {
      const text = await extractPdfText(file.buffer);
      const stored = await storeFile(file.buffer);
      filePath = stored.filePath;

      const safeName = file.originalname.replace(/[^\w.\- ]+/g, '_').slice(0, 200) || 'resume.pdf';
      const id = await insertResume({
        userId: req.userId,
        originalFilename: safeName,
        storageIdentifier: stored.storageIdentifier,
        text,
        fileSize: file.buffer.length,
        hash: sha256(file.buffer),
      });

      reserved = false; // slot legitimately consumed
      res.status(201).json({
        success: true,
        resume: { id, originalFilename: safeName, fileSize: file.buffer.length, textLength: text.length },
        usage: await getDailyUsage(req.userId),
      });
    } catch (err) {
      if (filePath) await fs.rm(filePath, { force: true }).catch(() => {});
      await release();
      throw err;
    }
  }),
);

// ── POST /api/resumes/text ──────────────────────────────────────────────────
router.post(
  '/text',
  uploadLimiter,
  validateBody(resumeTextSchema),
  asyncHandler(async (req, res) => {
    const { text, originalFilename } = req.body;
    const label = originalFilename || 'Pasted resume text';
    const size = Buffer.byteLength(text, 'utf8');

    await reserveOrFail(req.userId, 'uploads');
    try {
      const id = await insertResume({
        userId: req.userId,
        originalFilename: label,
        storageIdentifier: crypto.randomUUID(),
        text,
        fileSize: size,
        hash: null,
      });
      res.status(201).json({
        success: true,
        resume: { id, originalFilename: label, fileSize: size, textLength: text.length },
        usage: await getDailyUsage(req.userId),
      });
    } catch (err) {
      await releaseSlot(req.userId, 'uploads').catch(() => {});
      throw err;
    }
  }),
);

// ── GET /api/resumes ────────────────────────────────────────────────────────
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT id, original_filename, file_size, uploaded_at, CHAR_LENGTH(extracted_text) AS text_length
       FROM resumes WHERE user_id = ? ORDER BY uploaded_at DESC LIMIT 100`,
      [req.userId],
    );
    res.json({
      success: true,
      resumes: rows.map(resumeMeta),
      usage: await getDailyUsage(req.userId),
    });
  }),
);

// ── GET /api/resumes/:id ────────────────────────────────────────────────────
router.get(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT id, original_filename, file_size, uploaded_at, extracted_text,
              CHAR_LENGTH(extracted_text) AS text_length
       FROM resumes WHERE id = ? AND user_id = ? LIMIT 1`,
      [req.params.id, req.userId],
    );
    if (!rows[0]) throw notFound('Resume not found.');
    const { extracted_text, ...rest } = rows[0];
    res.json({ success: true, resume: resumeMeta(rest), text: extracted_text });
  }),
);

// ── DELETE /api/resumes/:id ─────────────────────────────────────────────────
router.delete(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      'SELECT storage_identifier FROM resumes WHERE id = ? AND user_id = ? LIMIT 1',
      [req.params.id, req.userId],
    );
    if (!rows[0]) throw notFound('Resume not found.');
    await pool.query('DELETE FROM resumes WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    await deleteStoredFile(rows[0].storage_identifier).catch(() => {});
    res.json({ success: true });
  }),
);

export default router;

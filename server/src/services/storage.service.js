import multer from 'multer';
import crypto from 'node:crypto';
import { extractPdfText } from './pdf.service.js';

/** Stores a PDF buffer in memory (no disk), extracts text, and discards the
 *  buffer after analysis. Used for Vercel's ephemeral function environment. */
export async function storeFile(buffer) {
  const id = crypto.randomUUID();
  return { storageIdentifier: id };
}

export async function deleteStoredFile(storageIdentifier) {
  // No on-disk file to remove: the buffer is garbage-collected after the
  // route handler returns.
}

export const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

export const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 0, files: 1 },
  fileFilter: (_req, file, cb) => {
    const mimeOk = ['application/pdf', 'application/octet-stream'].includes(file.mimetype);
    if (mimeOk) return cb(null, true);
    cb(new Error('Only PDF files are accepted.'));
  },
});

/** Extracts text and removes the buffer from scope afterwards. */
export async function processResume(buffer, originalName) {
  const text = await extractPdfText(buffer);
  return { storageIdentifier: crypto.randomUUID(), text };
}

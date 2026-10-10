import { extractText, getDocumentProxy } from 'unpdf';
import { env } from '../config/env.js';
import { badRequest } from '../utils/errors.js';

const PDF_MAGIC = Buffer.from('%PDF-');

/** Validates extension, MIME type, PDF signature and size before any processing. */
export function validatePdfBuffer(buffer, originalName = '') {
  if (!buffer || buffer.length === 0) {
    throw badRequest('The uploaded file is empty.');
  }
  const maxBytes = env.MAX_RESUME_FILE_SIZE_MB * 1024 * 1024;
  if (buffer.length > maxBytes) {
    throw badRequest(`Resume file exceeds the ${env.MAX_RESUME_FILE_SIZE_MB} MB limit.`);
  }
  if (!/\.pdf$/i.test(originalName)) {
    throw badRequest('Only PDF files are accepted for PDF upload.');
  }
  if (!buffer.subarray(0, 5).equals(PDF_MAGIC)) {
    throw badRequest('The file does not look like a valid PDF.');
  }
  return true;
}

/**
 * Extracts usable text from a PDF buffer.
 * Throws a clear, user-facing error for encrypted, empty or unreadable files.
 */
export async function extractPdfText(buffer) {
  let pdfDoc;
  try {
    pdfDoc = await getDocumentProxy(new Uint8Array(buffer), { throwOnInvalidPDF: true });
  } catch (err) {
    if (err?.name === 'PasswordException' || /password|encrypt/i.test(err?.message || '')) {
      throw badRequest('This PDF is password protected. Please upload an unprotected file or paste the text.');
    }
    throw badRequest('This PDF could not be read. Please try a different file or paste the text.');
  }

  let text = '';
  try {
    const result = await extractText(pdfDoc, { mergePages: true });
    text = (result.text || '').replace(/\s+/g, ' ').trim();
  } catch (err) {
    throw badRequest('Text could not be extracted from this PDF. Please paste the resume text instead.');
  }

  if (text.length < 50) {
    throw badRequest(
      'No usable text was found in this PDF (it may be a scanned image). Please paste the resume text instead.',
    );
  }

  const limit = env.MAX_INPUT_CHARACTERS;
  if (text.length > limit) text = text.slice(0, limit);
  return text;
}

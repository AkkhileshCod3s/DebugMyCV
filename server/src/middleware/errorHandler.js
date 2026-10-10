import { ApiError } from '../utils/errors.js';
import { env } from '../config/env.js';

export function notFoundHandler(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.path}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = 500;
  let message = 'Something went wrong. Please try again.';
  let details;

  if (err instanceof ApiError) {
    status = err.status;
    message = err.message;
    details = err.details;
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large.';
  } else if (err?.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      status = 413;
      message = `Resume file exceeds the ${env.MAX_RESUME_FILE_SIZE_MB} MB limit.`;
    } else {
      status = 400;
      message = 'Invalid file upload.';
    }
  } else if (err?.code === 'EBADRESP' || err?.errno || err?.sql) {
    status = 503;
    message = 'Database unavailable. Please try again shortly.';
  }

  if (status >= 500) {
    // Log server-side only; never expose stack traces or SQL to clients.
    console.error('[error]', err?.stack || err);
  }

  res.status(status).json({
    success: false,
    message,
    ...(details && env.NODE_ENV !== 'production' ? { details } : {}),
  });
}

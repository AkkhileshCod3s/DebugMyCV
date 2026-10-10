import { ApiError } from '../utils/errors.js';

/** Parses req.body with a zod schema; replaces body with the parsed value. */
export const validateBody = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const details = result.error.issues.map((i) => i.message);
    return next(new ApiError(400, details[0] || 'Invalid request.', details));
  }
  req.body = result.data;
  next();
};

/** Parses req.params with a zod schema (e.g. { id }). */
export const validateParams = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    return next(new ApiError(400, 'Invalid request parameter.'));
  }
  req.params = result.data;
  next();
};

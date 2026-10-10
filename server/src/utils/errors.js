/** Application error with an HTTP status and a safe, user-facing message. */
export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message, details) => new ApiError(400, message, details);
export const unauthorized = (message = 'Please sign in to continue.') => new ApiError(401, message);
export const forbidden = (message = 'You do not have access to this resource.') => new ApiError(403, message);
export const notFound = (message = 'Resource not found.') => new ApiError(404, message);
export const conflict = (message) => new ApiError(409, message);
export const tooMany = (message) => new ApiError(429, message);
export const serverError = (message = 'Something went wrong. Please try again.') => new ApiError(500, message);

/** Wraps async route handlers so rejected promises reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

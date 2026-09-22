const ApiError = require('../utils/apiError');

/** Turns any unmatched route into a 404 handled by the error handler below. */
function notFoundHandler(req, res, next) {
  next(ApiError.notFound('ROUTE_NOT_FOUND', `Cannot ${req.method} ${req.originalUrl}.`));
}

/**
 * Central error handler: every failure leaves the API in the same JSON shape.
 *
 *   { "error": { "code": "...", "message": "..." } }
 */
// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity.
function errorHandler(error, req, res, next) {
  if (error instanceof ApiError) {
    return res.status(error.status).json({
      error: { code: error.code, message: error.message },
    });
  }

  // Malformed JSON bodies are rejected by express.json() before we see them.
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'Request body is not valid JSON.' },
    });
  }

  console.error('Unexpected error:', error);

  return res.status(500).json({
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' },
  });
}

module.exports = { notFoundHandler, errorHandler };

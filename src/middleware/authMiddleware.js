const jwt = require('jsonwebtoken');

const config = require('../config');
const userModel = require('../models/userModel');
const ApiError = require('../utils/apiError');

/**
 * Requires a valid `Authorization: Bearer <token>` header.
 *
 * On success it attaches the authenticated user to `req.user`; otherwise it
 * forwards a 401 to the error middleware.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(
      ApiError.unauthorized(
        'MISSING_TOKEN',
        'Authorization header with a Bearer token is required.'
      )
    );
  }

  const token = header.slice('Bearer '.length).trim();

  if (!token) {
    return next(ApiError.unauthorized('MISSING_TOKEN', 'Bearer token must not be empty.'));
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch (error) {
    const expired = error.name === 'TokenExpiredError';
    return next(
      ApiError.unauthorized(
        expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
        expired ? 'Token has expired, please log in again.' : 'Token is invalid.'
      )
    );
  }

  // The token could have been issued before a restart wiped the in-memory store.
  const user = userModel.findById(payload.sub);

  if (!user) {
    return next(
      ApiError.unauthorized('USER_NOT_FOUND', 'The user for this token no longer exists.')
    );
  }

  req.user = userModel.toPublic(user);
  return next();
}

module.exports = { authenticate };

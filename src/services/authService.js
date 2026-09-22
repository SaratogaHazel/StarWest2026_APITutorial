const jwt = require('jsonwebtoken');

const config = require('../config');
const userModel = require('../models/userModel');
const ApiError = require('../utils/apiError');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

/**
 * Creates a new user in the in-memory store.
 * Throws 400 on invalid input and 409 when the email is already taken.
 */
function register({ name, email, password }) {
  if (!name || !email || !password) {
    throw ApiError.badRequest(
      'VALIDATION_ERROR',
      'name, email and password are required.'
    );
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw ApiError.badRequest('VALIDATION_ERROR', 'email must be a valid email address.');
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw ApiError.badRequest(
      'VALIDATION_ERROR',
      `password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
    );
  }

  if (userModel.findByEmail(email)) {
    throw ApiError.conflict('EMAIL_ALREADY_REGISTERED', 'That email is already registered.');
  }

  const user = userModel.create({ name, email, password });
  return userModel.toPublic(user);
}

/**
 * Verifies credentials and issues a JWT.
 *
 * An unknown email and a wrong password produce the same 401 response so the
 * API does not reveal which accounts exist.
 */
function login({ email, password }) {
  if (!email || !password) {
    throw ApiError.badRequest('VALIDATION_ERROR', 'email and password are required.');
  }

  const user = userModel.findByEmail(email);

  if (!user || user.password !== password) {
    throw ApiError.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  const token = jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  return {
    token,
    tokenType: 'Bearer',
    expiresIn: config.jwtExpiresIn,
    user: userModel.toPublic(user),
  };
}

module.exports = { register, login };

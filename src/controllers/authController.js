const authService = require('../services/authService');

/** POST /api/auth/register */
function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {};
    const user = authService.register({ name, email, password });
    res.status(201).json({ message: 'User registered successfully.', user });
  } catch (error) {
    next(error);
  }
}

/** POST /api/auth/login */
function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const result = authService.login({ email, password });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login };

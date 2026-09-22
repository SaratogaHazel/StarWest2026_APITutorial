/**
 * Application configuration.
 *
 * Values come from environment variables when present, otherwise they fall back
 * to development defaults so the API runs with zero setup.
 */
module.exports = {
  port: process.env.PORT || 3000,

  // NOTE: a hard-coded fallback secret is fine for this tutorial only.
  // A real deployment must supply JWT_SECRET from the environment.
  jwtSecret: process.env.JWT_SECRET || 'starwest-2026-tutorial-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',

  // Business rules
  cashDiscountRate: 0.1,
  paymentMethods: {
    CASH: 'cash',
    CREDIT_CARD: 'credit_card',
  },
};

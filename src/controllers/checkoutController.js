const checkoutService = require('../services/checkoutService');

/**
 * POST /api/checkout
 * Reaches this point only after authMiddleware has populated req.user.
 */
function checkout(req, res, next) {
  try {
    const { paymentMethod, items } = req.body || {};
    const order = checkoutService.checkout({
      user: req.user,
      paymentMethod,
      items,
    });
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
}

module.exports = { checkout };

const express = require('express');

const checkoutController = require('../controllers/checkoutController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Business rule: only authenticated users can check out.
router.post('/', authenticate, checkoutController.checkout);

module.exports = router;

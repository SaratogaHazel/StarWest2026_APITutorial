const { randomUUID } = require('crypto');

const config = require('../config');
const productModel = require('../models/productModel');
const ApiError = require('../utils/apiError');
const { toMoney } = require('../utils/money');

const ALLOWED_PAYMENT_METHODS = Object.values(config.paymentMethods);

/**
 * Validates that the payment method is one the store accepts.
 * Business rule: only cash and credit_card are allowed.
 */
function validatePaymentMethod(paymentMethod) {
  if (!paymentMethod) {
    throw ApiError.badRequest('VALIDATION_ERROR', 'paymentMethod is required.');
  }

  if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
    throw ApiError.badRequest(
      'INVALID_PAYMENT_METHOD',
      `paymentMethod must be one of: ${ALLOWED_PAYMENT_METHODS.join(', ')}.`
    );
  }
}

/**
 * Resolves each requested item against the catalog and prices its line.
 * Throws 400 on malformed items and 404 when a product does not exist.
 */
function buildLineItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest('VALIDATION_ERROR', 'items must be a non-empty array.');
  }

  return items.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw ApiError.badRequest('VALIDATION_ERROR', `items[${index}] must be an object.`);
    }

    const { productId, quantity } = item;

    if (!Number.isInteger(productId)) {
      throw ApiError.badRequest(
        'VALIDATION_ERROR',
        `items[${index}].productId must be an integer.`
      );
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw ApiError.badRequest(
        'VALIDATION_ERROR',
        `items[${index}].quantity must be an integer greater than 0.`
      );
    }

    const product = productModel.findById(productId);

    if (!product) {
      throw ApiError.notFound('PRODUCT_NOT_FOUND', `No product found with id ${productId}.`);
    }

    return {
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity,
      lineTotal: toMoney(product.price * quantity),
    };
  });
}

/**
 * Prices an order for an authenticated user.
 *
 * Business rules applied here:
 *   - only cash and credit_card are accepted
 *   - cash orders receive a 10% discount
 */
function checkout({ user, paymentMethod, items }) {
  validatePaymentMethod(paymentMethod);

  const lineItems = buildLineItems(items);

  const subtotal = toMoney(lineItems.reduce((sum, line) => sum + line.lineTotal, 0));
  const discountRate =
    paymentMethod === config.paymentMethods.CASH ? config.cashDiscountRate : 0;
  const discount = toMoney(subtotal * discountRate);
  const total = toMoney(subtotal - discount);

  return {
    orderId: randomUUID(),
    userId: user.id,
    items: lineItems,
    paymentMethod,
    subtotal,
    discountRate,
    discount,
    total,
    currency: 'USD',
    createdAt: new Date().toISOString(),
  };
}

module.exports = { checkout };

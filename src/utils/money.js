/**
 * Rounds a monetary amount to two decimal places.
 *
 * Every price calculation in the API goes through this helper so line totals,
 * discounts and grand totals are always rounded the same way.
 */
function toMoney(amount) {
  return Math.round(amount * 100) / 100;
}

module.exports = { toMoney };

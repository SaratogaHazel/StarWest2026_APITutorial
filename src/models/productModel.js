/**
 * In-memory product catalog.
 *
 * Seeded with three products on startup. Prices are in USD.
 */
const products = [
  {
    id: 1,
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with a USB-C receiver.',
    price: 25.5,
  },
  {
    id: 2,
    name: 'Mechanical Keyboard',
    description: '87-key mechanical keyboard with tactile switches.',
    price: 89.99,
  },
  {
    id: 3,
    name: '27-inch Monitor',
    description: '27-inch QHD monitor with a height-adjustable stand.',
    price: 199.0,
  },
];

function findAll() {
  return products.map((product) => ({ ...product }));
}

function findById(id) {
  return products.find((product) => product.id === id);
}

module.exports = { findAll, findById };

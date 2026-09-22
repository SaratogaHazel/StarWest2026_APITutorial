/**
 * Shared test configuration.
 *
 * The suite runs against a real HTTP server (see support/server.js), so every
 * Supertest call targets BASE_URL rather than an in-process Express app.
 *
 * All test data below is taken from the "Existent Data" section of README.md.
 */
const PORT = process.env.TEST_PORT || 3001;

module.exports = {
  PORT,
  BASE_URL: `http://localhost:${PORT}`,

  // Seeded user (README -> Existent Data -> Users)
  seededUser: {
    email: 'alice@example.com',
    password: 'Password123',
  },

  // Registration payload (README -> How to Use the Rest API -> Register)
  newUser: {
    name: 'Dave Lee',
    email: 'dave@example.com',
    password: 'Password123',
  },

  // Seeded products (README -> Existent Data -> Products)
  products: {
    wirelessMouse: { id: 1, name: 'Wireless Mouse', price: 25.5 },
    mechanicalKeyboard: { id: 2, name: 'Mechanical Keyboard', price: 89.99 },
  },
};

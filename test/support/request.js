const supertest = require('supertest');

const { BASE_URL } = require('./config');

/**
 * Supertest bound to the running server's URL.
 *
 * Passing a URL string (rather than an Express app) makes Supertest issue real
 * HTTP requests over the network stack instead of mounting the app in-process.
 */
module.exports = () => supertest(BASE_URL);

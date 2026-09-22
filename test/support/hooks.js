const server = require('./server');

/**
 * Mocha global fixtures: the API is started once before the whole suite and
 * stopped once after it, so `npm test` is a single self-contained command.
 *
 * Because the API runs in its own process, the in-memory data store is reset
 * to its seeded state on every run.
 */
exports.mochaGlobalSetup = async function mochaGlobalSetup() {
  await server.start();
};

exports.mochaGlobalTeardown = async function mochaGlobalTeardown() {
  await server.stop();
};

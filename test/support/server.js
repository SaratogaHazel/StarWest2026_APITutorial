const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const { PORT, BASE_URL } = require('./config');

const SERVER_ENTRY = path.join(__dirname, '..', '..', 'src', 'server.js');
const STARTUP_TIMEOUT_MS = 15000;
const POLL_INTERVAL_MS = 250;

let serverProcess;

/** Resolves true as soon as the healthcheck answers, false on any error. */
function ping() {
  return new Promise((resolve) => {
    const request = http.get(`${BASE_URL}/api/health`, (response) => {
      response.resume();
      resolve(response.statusCode === 200);
    });
    request.on('error', () => resolve(false));
    request.setTimeout(1000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

/** Polls the healthcheck until the API answers or the timeout expires. */
async function waitUntilReady() {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (await ping()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`API did not become ready at ${BASE_URL} within ${STARTUP_TIMEOUT_MS}ms.`);
}

/**
 * Makes sure an API is listening on the test port.
 *
 * If one is already answering the healthcheck it is reused -- this is what the
 * GitHub Actions pipeline does, since it starts the API and waits for it before
 * invoking Mocha. Otherwise a fresh one is started here, which keeps
 * `npm test` self-contained on a developer machine.
 *
 * Either way the API runs in its own process, which is what lets Supertest talk
 * real HTTP to a real server instead of importing the Express app.
 */
async function start() {
  if (await ping()) {
    console.log(`  Reusing the API already running at ${BASE_URL}`);
    return;
  }

  serverProcess = spawn(process.execPath, [SERVER_ENTRY], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.on('error', (error) => {
    throw new Error(`Failed to spawn the API process: ${error.message}`);
  });

  let stderr = '';
  serverProcess.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  serverProcess.on('exit', (code) => {
    if (code !== null && code !== 0) {
      console.error(`API process exited early with code ${code}.\n${stderr}`);
    }
  });

  await waitUntilReady();
  console.log(`  Test API ready at ${BASE_URL}`);
}

/**
 * Stops the API process, but only if start() was the one that launched it.
 * An API supplied by the pipeline is left alone.
 */
function stop() {
  if (!serverProcess || serverProcess.exitCode !== null) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    serverProcess.once('exit', resolve);
    serverProcess.kill();
    // Fallback in case the process ignores the signal.
    setTimeout(() => {
      serverProcess.kill('SIGKILL');
      resolve();
    }, 3000).unref();
  });
}

module.exports = { start, stop };

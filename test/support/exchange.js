const addContext = require('mochawesome/addContext');

/**
 * Sends a Supertest request and attaches the whole HTTP exchange to the
 * Mochawesome report.
 *
 * Without this, a failing test shows only the assertion diff; with it the
 * report also carries the exact request that was sent and the response that
 * came back, so a CI failure can be diagnosed without re-running anything.
 *
 * Because it needs Mocha's test context, callers must use `async function ()`
 * rather than an arrow function and pass `this`.
 */
async function send(test, request) {
  const outgoing = {
    method: request.method,
    url: request.url,
    headers: redactHeaders(request.header),
    body: redactBody(request._data),
  };

  let response;

  try {
    response = await request;
  } catch (error) {
    // Transport-level failure: there is no response to record.
    addContext(test, { title: 'Request', value: outgoing });
    addContext(test, { title: 'Transport error', value: error.message });
    throw error;
  }

  addContext(test, { title: 'Request', value: outgoing });
  addContext(test, {
    title: `Response (${response.status})`,
    value: {
      status: response.status,
      headers: response.headers,
      body: redactBody(response.body),
    },
  });

  return response;
}

/** Shortens bearer tokens so reports stay readable and do not leak whole JWTs. */
function redactHeaders(headers = {}) {
  const safe = { ...headers };

  if (typeof safe.Authorization === 'string') {
    safe.Authorization = truncateToken(safe.Authorization);
  }

  return safe;
}

/** Masks passwords and shortens tokens in request and response bodies. */
function redactBody(body) {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const safe = { ...body };

  if ('password' in safe) {
    safe.password = '***';
  }

  if (typeof safe.token === 'string') {
    safe.token = truncateToken(safe.token);
  }

  return safe;
}

function truncateToken(value) {
  return value.length > 24 ? `${value.slice(0, 24)}...(truncated)` : value;
}

module.exports = { send };

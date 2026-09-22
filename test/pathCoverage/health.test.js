const { expect } = require('chai');

const request = require('../support/request');

/**
 * Path 1 of 4: GET /api/health
 * Swagger operationId: healthcheck (no authentication required).
 */
describe('Path Coverage: GET /api/health', () => {
  it('returns the service health status', async () => {
    const response = await request().get('/api/health');

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('status', 'ok');
    expect(response.body).to.have.property('uptime').that.is.a('number');
    expect(response.body).to.have.property('timestamp').that.is.a('string');
  });
});

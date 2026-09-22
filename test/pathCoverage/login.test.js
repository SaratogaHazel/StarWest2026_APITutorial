const { expect } = require('chai');

const request = require('../support/request');
const { send } = require('../support/exchange');
const { seededUser } = require('../support/config');

/**
 * Path 3 of 4: POST /api/auth/login
 * Swagger operationId: login (no authentication required).
 */
describe('Path Coverage: POST /api/auth/login', () => {
  it('authenticates a seeded user and returns a JWT', async function () {
    const response = await send(
      this,
      request().post('/api/auth/login').set('Content-Type', 'application/json').send(seededUser)
    );

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('token').that.is.a('string').and.is.not.empty;
    // A JWT is three dot-separated segments.
    expect(response.body.token.split('.')).to.have.lengthOf(3);
    expect(response.body).to.have.property('tokenType', 'Bearer');
    expect(response.body).to.have.property('expiresIn', '1h');
    expect(response.body).to.have.property('user');
    expect(response.body.user).to.have.property('email', seededUser.email);
    expect(response.body.user).to.not.have.property('password');
  });
});

const { expect } = require('chai');

const request = require('../support/request');
const { send } = require('../support/exchange');
const { newUser } = require('../support/config');

/**
 * Path 2 of 4: POST /api/auth/register
 * Swagger operationId: register (no authentication required).
 */
describe('Path Coverage: POST /api/auth/register', () => {
  it('registers a new user', async function () {
    const response = await send(
      this,
      request().post('/api/auth/register').set('Content-Type', 'application/json').send(newUser)
    );

    expect(response.status).to.equal(201);
    expect(response.body).to.have.property('message', 'User registered successfully.');
    expect(response.body).to.have.property('user');
    expect(response.body.user).to.have.property('id').that.is.a('number');
    expect(response.body.user).to.have.property('name', newUser.name);
    expect(response.body.user).to.have.property('email', newUser.email);
    // The password must never be echoed back to the client.
    expect(response.body.user).to.not.have.property('password');
  });
});

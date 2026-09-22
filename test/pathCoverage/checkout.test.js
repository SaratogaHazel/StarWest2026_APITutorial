const { expect } = require('chai');

const request = require('../support/request');
const { send } = require('../support/exchange');
const { seededUser, products } = require('../support/config');

/**
 * Path 4 of 4: POST /api/checkout
 * Swagger operationId: checkout (requires a Bearer token).
 *
 * The cart below is the worked example from the README: 2 x Wireless Mouse
 * plus 1 x Mechanical Keyboard, paid in cash, so the 10% discount applies.
 */
describe('Path Coverage: POST /api/checkout', () => {
  let token;

  before(async () => {
    // Authentication is a precondition of this path, not part of its assertions.
    const login = await request()
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(seededUser);

    expect(login.status, `login precondition failed: ${JSON.stringify(login.body)}`).to.equal(200);
    token = login.body.token;
  });

  it('prices a cash order for an authenticated user', async function () {
    const response = await send(
      this,
      request()
        .post('/api/checkout')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
        .send({
          paymentMethod: 'cash',
          items: [
            { productId: products.wirelessMouse.id, quantity: 2 },
            { productId: products.mechanicalKeyboard.id, quantity: 1 },
          ],
        })
    );

    expect(response.status).to.equal(201);
    expect(response.body).to.have.property('orderId').that.is.a('string');
    expect(response.body).to.have.property('userId').that.is.a('number');
    expect(response.body).to.have.property('paymentMethod', 'cash');
    expect(response.body).to.have.property('currency', 'USD');
    expect(response.body).to.have.property('createdAt').that.is.a('string');

    // 2 x 25.50 + 1 x 89.99 = 140.99, less the 10% cash discount.
    expect(response.body).to.have.property('subtotal', 140.99);
    expect(response.body).to.have.property('discountRate', 0.1);
    expect(response.body).to.have.property('discount', 14.1);
    expect(response.body).to.have.property('total', 126.89);

    expect(response.body.items).to.be.an('array').with.lengthOf(2);
    expect(response.body.items[0]).to.include({
      productId: products.wirelessMouse.id,
      name: products.wirelessMouse.name,
      unitPrice: products.wirelessMouse.price,
      quantity: 2,
      lineTotal: 51,
    });
  });
});

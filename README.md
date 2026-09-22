# StarWest2026_APITutorial

## Description

A small e-commerce REST API built with **JavaScript** and **Express**. It demonstrates two things end to end:

1. **JWT authentication** — a consumer registers, logs in, and receives a signed token.
2. **A rules-driven checkout** — the token is required to price a cart, and the payment method changes the total.

Everything runs in memory. There is no database, no migration step, and no test automation — clone, install, and run.

The project is organised in conventional Express layers so each responsibility is easy to find:

```
swagger.yaml               OpenAPI 3.0 description of the API
src/
  server.js                Entry point (starts the HTTP listener)
  app.js                   Express app wiring
  config/                  Port, JWT settings, business-rule constants
  routes/                  URL to controller mapping
  middleware/              JWT authentication, 404 and error handling
  controllers/             Read the request, call a service, shape the response
  services/                Business rules (auth, checkout pricing)
  models/                  In-memory users and products
  utils/                   ApiError type, money rounding helper
```

A request flows in one direction: **route → middleware → controller → service → model**.

## Installation

Requires **Node.js 18 or newer** (uses the built-in `crypto.randomUUID`).

```bash
git clone https://github.com/SaratogaHazel/StarWest2026_APITutorial.git
cd StarWest2026_APITutorial
npm install
```

## How to Run

```bash
npm start
```

The server prints:

```
API listening on http://localhost:3000
Swagger UI available at http://localhost:3000/api-docs
```

Open <http://localhost:3000/api-docs> for interactive documentation.

Optional environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `JWT_SECRET` | a built-in development secret | Key used to sign tokens |
| `JWT_EXPIRES_IN` | `1h` | Token lifetime |

## Rules

**Checkout rules**

1. The checkout accepts **only** `cash` or `credit_card`. Any other value is rejected with `400 INVALID_PAYMENT_METHOD`.
2. **Cash gives a 10% discount** on the subtotal. Credit card orders pay the full subtotal.
3. **Only authenticated users can check out.** A valid `Authorization: Bearer <token>` header is required; without one the request fails with `401`.

**Project rules**

- The API exposes exactly four business endpoints — login, register, checkout, and healthcheck — plus `/api-docs`, which renders the Swagger file.
- All data lives in memory and **resets every time the server restarts**. Users you register and orders you place are not persisted.
- The store is seeded with 3 users and 3 products (see below).
- No test automation is included in this project.

**Tutorial simplifications — do not copy these into production**

- Passwords are stored and compared in **plain text** so the seed data is readable. A real application must hash passwords with bcrypt or argon2.
- `JWT_SECRET` falls back to a hard-coded value when the environment variable is absent. A real deployment must always supply its own secret.

## Existent Data

### Users

All three seeded users share the password `Password123`.

| id | Name | Email | Password |
|---|---|---|---|
| 1 | Alice Johnson | `alice@example.com` | `Password123` |
| 2 | Bob Smith | `bob@example.com` | `Password123` |
| 3 | Carol Davis | `carol@example.com` | `Password123` |

### Products

| id | Name | Price (USD) | Description |
|---|---|---|---|
| 1 | Wireless Mouse | 25.50 | Ergonomic wireless mouse with a USB-C receiver. |
| 2 | Mechanical Keyboard | 89.99 | 87-key mechanical keyboard with tactile switches. |
| 3 | 27-inch Monitor | 199.00 | 27-inch QHD monitor with a height-adjustable stand. |

## How to Use the Rest API

Base URL: `http://localhost:3000`

| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| `GET` | `/api/health` | No | Healthcheck |
| `POST` | `/api/auth/register` | No | Create a user |
| `POST` | `/api/auth/login` | No | Get a JWT |
| `POST` | `/api/checkout` | **Yes** | Price a cart |
| `GET` | `/api-docs` | No | Swagger UI |

The typical flow is **login → copy the token → call checkout with it**.

### 1. Healthcheck

```bash
curl http://localhost:3000/api/health
```

```json
{ "status": "ok", "uptime": 12.47, "timestamp": "2026-09-22T16:42:59.825Z" }
```

### 2. Register

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Dave Lee","email":"dave@example.com","password":"Password123"}'
```

`201 Created`:

```json
{
  "message": "User registered successfully.",
  "user": { "id": 4, "name": "Dave Lee", "email": "dave@example.com" }
}
```

Registering the same email twice returns `409 EMAIL_ALREADY_REGISTERED`. Passwords must be at least 6 characters.

### 3. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"Password123"}'
```

`200 OK`:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": "1h",
  "user": { "id": 1, "name": "Alice Johnson", "email": "alice@example.com" }
}
```

Wrong email or wrong password both return the same `401 INVALID_CREDENTIALS`, so the API does not reveal which accounts exist.

To capture the token in a shell variable:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","password":"Password123"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')
```

### 4. Checkout — cash (10% discount)

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
        "paymentMethod": "cash",
        "items": [
          { "productId": 1, "quantity": 2 },
          { "productId": 2, "quantity": 1 }
        ]
      }'
```

`201 Created` — subtotal 140.99, 10% off, total **126.89**:

```json
{
  "orderId": "62eaab6b-52db-42ee-a227-908b08c7e435",
  "userId": 1,
  "items": [
    { "productId": 1, "name": "Wireless Mouse", "unitPrice": 25.5, "quantity": 2, "lineTotal": 51 },
    { "productId": 2, "name": "Mechanical Keyboard", "unitPrice": 89.99, "quantity": 1, "lineTotal": 89.99 }
  ],
  "paymentMethod": "cash",
  "subtotal": 140.99,
  "discountRate": 0.1,
  "discount": 14.1,
  "total": 126.89,
  "currency": "USD",
  "createdAt": "2026-09-22T16:43:14.231Z"
}
```

### 5. Checkout — credit card (no discount)

The same cart paid by card costs the full subtotal:

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
        "paymentMethod": "credit_card",
        "items": [
          { "productId": 1, "quantity": 2 },
          { "productId": 2, "quantity": 1 }
        ]
      }'
```

```json
{ "subtotal": 140.99, "discountRate": 0, "discount": 0, "total": 140.99, "...": "..." }
```

### Error responses

Every failure uses the same shape, so a client can branch on `error.code`:

```json
{ "error": { "code": "INVALID_PAYMENT_METHOD", "message": "paymentMethod must be one of: cash, credit_card." } }
```

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | A required field is missing or malformed (empty `items`, `quantity` below 1, short password) |
| 400 | `INVALID_PAYMENT_METHOD` | `paymentMethod` is not `cash` or `credit_card` |
| 400 | `INVALID_JSON` | The request body is not valid JSON |
| 401 | `MISSING_TOKEN` | No `Authorization: Bearer` header on checkout |
| 401 | `INVALID_TOKEN` / `TOKEN_EXPIRED` | The token is not valid, or has expired |
| 401 | `INVALID_CREDENTIALS` | Login email or password is wrong |
| 404 | `PRODUCT_NOT_FOUND` | A `productId` in the cart is not in the catalog |
| 404 | `ROUTE_NOT_FOUND` | No such endpoint |
| 409 | `EMAIL_ALREADY_REGISTERED` | Registering an email that already exists |

### Using Swagger UI

Open <http://localhost:3000/api-docs>, then:

1. Run `POST /api/auth/login` with one of the seeded users and copy the `token` from the response.
2. Click **Authorize** at the top right, paste the token, and confirm.
3. Run `POST /api/checkout` — the token is now attached automatically.

The raw specification is served at <http://localhost:3000/api-docs/swagger.yaml> and is also committed as [`swagger.yaml`](swagger.yaml) at the repository root, ready to import into Postman or another client.

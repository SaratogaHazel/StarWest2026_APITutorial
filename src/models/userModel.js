/**
 * In-memory user store.
 *
 * The array below IS the database. It is seeded with three users on startup and
 * every change is lost when the process stops.
 *
 * Passwords are stored in plain text to keep this tutorial easy to read.
 * Never do this in a real application - hash them with bcrypt or argon2.
 */
const users = [
  {
    id: 1,
    name: 'Alice Johnson',
    email: 'alice@example.com',
    password: 'Password123',
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@example.com',
    password: 'Password123',
  },
  {
    id: 3,
    name: 'Carol Davis',
    email: 'carol@example.com',
    password: 'Password123',
  },
];

let nextId = users.length + 1;

function findByEmail(email) {
  if (typeof email !== 'string') {
    return undefined;
  }
  const normalized = email.trim().toLowerCase();
  return users.find((user) => user.email === normalized);
}

function findById(id) {
  return users.find((user) => user.id === id);
}

function create({ name, email, password }) {
  const user = {
    id: nextId++,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
  };
  users.push(user);
  return user;
}

/** Returns a copy of the user without the password, safe to send to a client. */
function toPublic(user) {
  return { id: user.id, name: user.name, email: user.email };
}

module.exports = { findByEmail, findById, create, toPublic };

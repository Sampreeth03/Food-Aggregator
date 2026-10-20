const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const express = require('express');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_12345';

describe('4. API Route & Auth Guard Integration Tests', () => {
  let server;
  let baseUrl;

  // Start a local test server on a random available port (port: 0)
  before(async () => {
    const app = express();
    app.use(express.json());
    
    // Mount routes
    app.use('/api/restaurants', require('../routes/restaurantRoutes'));
    app.use('/api/orders', require('../routes/orderRoutes'));
    app.use('/api/auth', require('../routes/authRoutes'));

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  // Close the server when tests finish
  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  // Test 1: Protected restaurants route blocks unauthenticated access
  test('GET /api/restaurants returns 401 when token is missing', async () => {
    const res = await fetch(`${baseUrl}/api/restaurants`);
    const data = await res.json();

    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.msg, 'Not authorized, token missing');
  });

  // Test 2: Protected orders route blocks unauthenticated access
  test('GET /api/orders returns 401 when token is missing', async () => {
    const res = await fetch(`${baseUrl}/api/orders`);
    const data = await res.json();

    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.msg, 'Not authorized, token missing');
  });

  // Test 3: Login rejects missing email and password
  test('POST /api/auth/login returns 400 when body is empty', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    const data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.msg, 'email and password are required');
  });

});

const { test, describe } = require('node:test');
const assert = require('node:assert');
const { createRateLimiter } = require('../middleware/rateLimiter');

describe('2. Sliding Window Rate Limiter Tests', () => {

  test('allows requests that are within the allowed limit', () => {
    const limiter = createRateLimiter({
      windowMs: 60 * 1000,
      max: 3,
      keyGenerator: (req) => req.ip
    });

    const req = { ip: '127.0.0.1' };
    const res = {};
    let nextCount = 0;
    const next = () => { nextCount++; };

    // Send 3 requests (limit is 3)
    limiter(req, res, next);
    limiter(req, res, next);
    limiter(req, res, next);

    // All 3 should be permitted through (calling next())
    assert.strictEqual(nextCount, 3);
  });

  test('blocks requests with 429 when max attempts exceeded', () => {
    const limiter = createRateLimiter({
      windowMs: 60 * 1000,
      max: 2, // Limit is only 2 requests
      keyGenerator: (req) => req.ip
    });

    const req = { ip: '192.168.1.10' };
    const next = () => { };
    let capturedStatusCode = null;
    let capturedBody = null;

    const res = {
      status: (code) => {
        capturedStatusCode = code;
        return {
          json: (body) => { capturedBody = body; }
        };
      }
    };

    // 1st request -> Allowed
    limiter(req, res, next);
    // 2nd request -> Allowed
    limiter(req, res, next);
    // 3rd request -> Must be BLOCKED!
    limiter(req, res, next);

    assert.strictEqual(capturedStatusCode, 429, 'Expected status code 429');
    assert.strictEqual(capturedBody.msg, 'Too many attempts, please try again later.');
  });
});

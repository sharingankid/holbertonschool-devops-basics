'use strict';

/**
 * TaskFlow test suite.
 *
 * Two scopes live in this one file, and the difference matters:
 *
 *   unit:        pure functions, no network, no database. Safe to run anywhere,
 *                including inside `docker build`.  ->  npm run test:unit
 *
 *   integration: real HTTP requests against the real API, hitting a real
 *                PostgreSQL that has been initialized with db/01-schema.sql and
 *                db/02-seed.sql. Needs a live stack.  ->  npm run test:integration
 *
 * `npm test` runs the unit scope only, on purpose: a build must never depend on
 * a database being reachable.
 *
 * The integration scope talks to whatever PGHOST/PGPORT/PGUSER/PGPASSWORD/
 * PGDATABASE point at. Set BASE_URL to test an already-running instance
 * (e.g. BASE_URL=http://localhost:3000 against the Compose stack) instead of
 * the in-process app.
 */

const request = require('supertest');

const {
  createApp,
  createPool,
  resolveDbConfig,
  validateItemPayload,
  PORT,
} = require('./server');

/* ------------------------------------------------------------------ */
/* unit scope — no database required                                    */
/* ------------------------------------------------------------------ */

describe('unit: resolveDbConfig', () => {
  test('falls back to sensible local defaults when nothing is set', () => {
    expect(resolveDbConfig({})).toEqual({
      host: 'localhost',
      port: 5432,
      user: 'taskflow',
      password: 'taskflow_dev',
      database: 'taskflow',
    });
  });

  test('reads every connection detail from the environment', () => {
    expect(
      resolveDbConfig({
        PGHOST: 'db',
        PGPORT: '6543',
        PGUSER: 'someone',
        PGPASSWORD: 's3cr3t',
        PGDATABASE: 'otherdb',
      })
    ).toEqual({
      host: 'db',
      port: 6543,
      user: 'someone',
      password: 's3cr3t',
      database: 'otherdb',
    });
  });
});

describe('unit: validateItemPayload', () => {
  test('accepts a non-empty name and trims it', () => {
    expect(validateItemPayload({ name: '  Delta Task  ' })).toEqual({
      valid: true,
      name: 'Delta Task',
    });
  });

  test.each([[undefined], [null], [{}], [{ name: '' }], [{ name: '   ' }], [{ name: 42 }]])(
    'rejects %p',
    (body) => {
      expect(validateItemPayload(body).valid).toBe(false);
    }
  );

  test('rejects a name longer than the column allows', () => {
    expect(validateItemPayload({ name: 'x'.repeat(256) }).valid).toBe(false);
  });
});

describe('unit: service constants', () => {
  test('the API listens on port 3000 by default', () => {
    expect(PORT).toBe(3000);
  });
});

/* ------------------------------------------------------------------ */
/* integration scope — needs a live PostgreSQL                          */
/* ------------------------------------------------------------------ */

describe('integration: TaskFlow API against a live stack', () => {
  let pool;
  let target;

  beforeAll(() => {
    if (process.env.BASE_URL) {
      target = process.env.BASE_URL;
    } else {
      pool = createPool(resolveDbConfig());
      target = createApp(pool);
    }
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  describe('integration: GET /health', () => {
    test('returns 200 and reports the database as connected', async () => {
      const res = await request(target).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.database).toBe('connected');
      expect(typeof res.body.hostname).toBe('string');
      expect(res.body.hostname.length).toBeGreaterThan(0);
    });
  });

  describe('integration: GET /items', () => {
    test('returns 200 and the three seeded rows in id order', async () => {
      const res = await request(target).get('/items');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      const seeded = res.body.slice(0, 3);
      expect(seeded.map((item) => item.name)).toEqual([
        'Alpha Task',
        'Beta Task',
        'Gamma Task',
      ]);
      expect(seeded.map((item) => item.id)).toEqual([1, 2, 3]);
      seeded.forEach((item) => expect(item.created_at).toBeTruthy());
    });
  });

  describe('integration: POST /items', () => {
    test('creates a row and returns 201 with the created item', async () => {
      const name = `Delta Task ${Date.now()}`;
      const res = await request(target)
        .post('/items')
        .set('Content-Type', 'application/json')
        .send({ name });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(name);
      expect(typeof res.body.id).toBe('number');
      expect(res.body.created_at).toBeTruthy();

      const listed = await request(target).get('/items');
      expect(listed.status).toBe(200);
      expect(listed.body.map((item) => item.name)).toContain(name);
    });

    test('returns 400 when the name is missing', async () => {
      const res = await request(target)
        .post('/items')
        .set('Content-Type', 'application/json')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeTruthy();
    });
  });
});

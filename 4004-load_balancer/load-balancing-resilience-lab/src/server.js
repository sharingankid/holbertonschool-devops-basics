'use strict';

/**
 * TaskFlow API — a deliberately small Express service backed by PostgreSQL.
 *
 * Everything about the database connection comes from environment variables,
 * so the exact same image runs unchanged on a laptop, in a Compose stack or
 * behind a load balancer. Nothing is hardcoded and nothing is read from a file.
 *
 *   GET  /health  -> 200 {"status":"ok",   ...} when SELECT 1 succeeds
 *                    503 {"status":"error", ...} when the database is unreachable
 *   GET  /items   -> 200 [ ...rows ordered by id... ]
 *   POST /items   -> 201 the created row   |   400 when "name" is missing
 */

const os = require('os');
const express = require('express');
const { Pool } = require('pg');

/** Port the API listens on inside its container. Fixed at 3000 across the course. */
const PORT = Number.parseInt(process.env.PORT, 10) || 3000;

/**
 * Build the Postgres connection settings from the environment.
 *
 * The defaults are what a developer running `npm start` next to a local
 * Postgres would want; every one of them is meant to be overridden by the
 * orchestrator (Compose sets PGHOST to the database's service name).
 *
 * @param {NodeJS.ProcessEnv} env
 * @returns {{host: string, port: number, user: string, password: string, database: string}}
 */
function resolveDbConfig(env = process.env) {
  return {
    host: env.PGHOST || 'localhost',
    port: Number.parseInt(env.PGPORT, 10) || 5432,
    user: env.PGUSER || 'taskflow',
    password: env.PGPASSWORD || 'taskflow_dev',
    database: env.PGDATABASE || 'taskflow',
  };
}

/**
 * Validate the body of POST /items.
 *
 * @param {unknown} body
 * @returns {{valid: boolean, name?: string, error?: string}}
 */
function validateItemPayload(body) {
  const name = body && typeof body === 'object' ? body.name : undefined;

  if (typeof name !== 'string' || name.trim() === '') {
    return { valid: false, error: 'name is required and must be a non-empty string' };
  }
  if (name.length > 255) {
    return { valid: false, error: 'name must be at most 255 characters' };
  }
  return { valid: true, name: name.trim() };
}

/**
 * A pg.Pool never connects eagerly: creating it cannot fail and cannot block.
 * That is exactly what we want here — the HTTP server must come up even when
 * Postgres is still initializing, and /health is what reports the difference.
 *
 * @param {object} [config]
 * @returns {import('pg').Pool}
 */
function createPool(config = resolveDbConfig()) {
  const pool = new Pool({
    ...config,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  // Without this listener an idle client dropped by the server (a database
  // restart, for instance) would surface as an uncaught exception and kill
  // the process. We log it and let the pool replace the client.
  pool.on('error', (err) => {
    console.error(`[taskflow] idle client error: ${err.message}`);
  });

  return pool;
}

/**
 * Build the Express application around a pool.
 *
 * @param {import('pg').Pool} pool
 * @returns {import('express').Express}
 */
function createApp(pool) {
  const app = express();

  app.use(express.json());

  app.use((req, res, next) => {
    res.on('finish', () => {
      console.log(`[taskflow] ${req.method} ${req.originalUrl} -> ${res.statusCode}`);
    });
    next();
  });

  /**
   * Readiness, not just liveness: the process answering is not enough, the
   * query has to come back. `hostname` is os.hostname(), which inside Docker
   * is the container ID — that is how you tell replicas apart behind a load
   * balancer.
   */
  app.get('/health', async (req, res) => {
    const base = {
      status: 'ok',
      uptime: Number(process.uptime().toFixed(1)),
      hostname: os.hostname(),
    };

    try {
      await pool.query('SELECT 1');
      res.status(200).json({ ...base, database: 'connected' });
    } catch (err) {
      console.error(`[taskflow] health check failed: ${err.message}`);
      res.status(503).json({
        ...base,
        status: 'error',
        database: 'disconnected',
        error: err.message,
      });
    }
  });

  app.get('/items', async (req, res) => {
    try {
      const { rows } = await pool.query(
        'SELECT id, name, created_at FROM items ORDER BY id ASC'
      );
      res.status(200).json(rows);
    } catch (err) {
      console.error(`[taskflow] GET /items failed: ${err.message}`);
      res.status(500).json({ error: 'database unavailable' });
    }
  });

  app.post('/items', async (req, res) => {
    const payload = validateItemPayload(req.body);

    if (!payload.valid) {
      res.status(400).json({ error: payload.error });
      return;
    }

    try {
      const { rows } = await pool.query(
        'INSERT INTO items (name) VALUES ($1) RETURNING id, name, created_at',
        [payload.name]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error(`[taskflow] POST /items failed: ${err.message}`);
      res.status(500).json({ error: 'database unavailable' });
    }
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'not found' });
  });

  return app;
}

/* istanbul ignore next -- only reached when the file is executed, not required */
if (require.main === module) {
  const config = resolveDbConfig();
  const pool = createPool(config);
  const app = createApp(pool);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[taskflow] listening on port ${PORT} (hostname ${os.hostname()})`);
    console.log(
      `[taskflow] database target ${config.user}@${config.host}:${config.port}/${config.database}`
    );
  });
}

module.exports = { createApp, createPool, resolveDbConfig, validateItemPayload, PORT };

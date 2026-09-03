-- 01-schema.sql — structure only.
--
-- The official Postgres image runs every file it finds in
-- /docker-entrypoint-initdb.d in filename-sorted order, and only when the data
-- directory is empty (i.e. on first initialization). The numeric prefix is what
-- guarantees this file runs before 02-seed.sql.

CREATE TABLE items (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

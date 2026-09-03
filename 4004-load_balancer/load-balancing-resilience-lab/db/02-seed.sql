-- 02-seed.sql — deterministic seed data.
--
-- Exactly three rows, always the same, always in this order, so they receive
-- ids 1, 2 and 3. That determinism is what makes "the database was reset" and
-- "the database persisted" distinguishable at a glance:
--   3 rows  -> the volume was wiped and the init scripts ran again
--   4+ rows -> your data survived

INSERT INTO items (name) VALUES ('Alpha Task');
INSERT INTO items (name) VALUES ('Beta Task');
INSERT INTO items (name) VALUES ('Gamma Task');

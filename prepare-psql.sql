-- make sure the UUID extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- make sure the preconditions for full-text search are met
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE AGGREGATE tsvector_agg (tsvector) (
  SFUNC = tsvector_concat,
  STYPE = tsvector
);

-- make sure the preconditions for UUID prefix search are met
CREATE EXTENSION IF NOT EXISTS pg_trgm;

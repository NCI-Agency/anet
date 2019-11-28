-- make sure the UUID extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- make sure the preconditions for full-text search are met
CREATE EXTENSION IF NOT EXISTS unaccent;
DROP TEXT SEARCH CONFIGURATION IF EXISTS anet;
CREATE TEXT SEARCH CONFIGURATION anet ( COPY = pg_catalog.english );
ALTER TEXT SEARCH CONFIGURATION anet ALTER MAPPING FOR hword, hword_part, word WITH unaccent, english_stem;

CREATE OR REPLACE AGGREGATE tsvector_agg (tsvector) (
  SFUNC = tsvector_concat,
  STYPE = tsvector
);

-- make sure the preconditions for UUID prefix search are met
CREATE EXTENSION IF NOT EXISTS pg_trgm;

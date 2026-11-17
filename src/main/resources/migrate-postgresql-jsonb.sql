-- JSON remains serialized at the API boundary, but is stored natively in PostgreSQL.
-- Conversion is transactional: malformed JSON (including blank text) aborts without data loss.
-- locations.geoJson is deliberately excluded: it will be migrated to the PostGIS Geometry type separately.
-- jsonb canonicalizes whitespace/key order and keeps the last value of duplicate object keys.
CREATE TEMP TABLE anet_jsonb_columns ON COMMIT DROP AS
SELECT c.table_schema, c.table_name, c.column_name
FROM information_schema.columns c
JOIN (VALUES
    ('locations', 'customFields'),
    ('organizations', 'customFields'),
    ('people', 'customFields'),
    ('positions', 'customFields'),
    ('reports', 'customFields'),
    ('tasks', 'customFields'),
    ('assessments', 'assessmentValues'),
    ('customSensitiveInformation', 'customFieldValue'),
    ('people', 'phoneNumber'),
    ('savedSearches', 'query'),
    ('pendingEmails', 'jobSpec')
) AS target(table_name, column_name)
    ON c.table_name = target.table_name AND c.column_name = target.column_name
WHERE c.table_schema = 'public'
    AND c.data_type IN ('character varying', 'text', 'json');

DO $migration$
DECLARE
    item record;
    default_expression text;
BEGIN
    -- Validate every value before dropping dependencies; SQL NULL remains SQL NULL.
    FOR item IN SELECT * FROM anet_jsonb_columns LOOP
        BEGIN
            EXECUTE format('SELECT %I::jsonb FROM %I.%I WHERE %I IS NOT NULL',
                item.column_name, item.table_schema, item.table_name, item.column_name);
        EXCEPTION WHEN data_exception THEN
            RAISE EXCEPTION 'Cannot convert %.%.% to jsonb: invalid JSON',
                item.table_schema, item.table_name, item.column_name USING ERRCODE = SQLSTATE;
        END;
    END LOOP;
    -- The final full-text-search changeset recreates views and generated search columns.
    FOR item IN SELECT schemaname, matviewname FROM pg_matviews
        WHERE schemaname = 'public' AND matviewname ~ '^mv_(lts|fts)_'
        ORDER BY matviewname LOOP
        -- Drop dependents first, without CASCADE, to protect unrelated database objects.
        EXECUTE format('DROP MATERIALIZED VIEW %I.%I', item.schemaname, item.matviewname);
    END LOOP;
    FOR item IN
        SELECT DISTINCT c.table_schema, c.table_name, generated.attname AS column_name
        FROM anet_jsonb_columns c
        JOIN pg_namespace n ON n.nspname = c.table_schema
        JOIN pg_class t ON t.relnamespace = n.oid AND t.relname = c.table_name
        JOIN pg_attribute source ON source.attrelid = t.oid AND source.attname = c.column_name
        JOIN pg_depend d ON d.refclassid = 'pg_class'::regclass
            AND d.refobjid = t.oid AND d.refobjsubid = source.attnum
            AND d.classid = 'pg_attrdef'::regclass
        JOIN pg_attrdef a ON a.oid = d.objid AND a.adrelid = t.oid
        JOIN pg_attribute generated ON generated.attrelid = t.oid AND generated.attnum = a.adnum
        WHERE generated.attgenerated <> '' AND generated.attname IN ('core_text', 'more_text')
    LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP COLUMN %I',
            item.table_schema, item.table_name, item.column_name);
    END LOOP;
    FOR item IN SELECT * FROM anet_jsonb_columns ORDER BY table_name, column_name LOOP
        SELECT pg_get_expr(d.adbin, d.adrelid) INTO default_expression
        FROM pg_attrdef d
        JOIN pg_class t ON t.oid = d.adrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.adnum
        WHERE n.nspname = item.table_schema AND t.relname = item.table_name
            AND a.attname = item.column_name;
        EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I DROP DEFAULT',
            item.table_schema, item.table_name, item.column_name);
        EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I TYPE jsonb USING %I::jsonb',
            item.table_schema, item.table_name, item.column_name, item.column_name);
        IF default_expression IS NOT NULL THEN
            EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I SET DEFAULT (%s)::jsonb',
                item.table_schema, item.table_name, item.column_name, default_expression);
        END IF;
    END LOOP;
END;
$migration$;

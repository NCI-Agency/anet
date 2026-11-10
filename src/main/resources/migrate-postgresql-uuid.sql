-- UUIDs remain strings at the API boundary, but are stored natively in PostgreSQL.
-- This changeset is transactional: invalid identifiers abort without losing data or dependencies.
CREATE TEMP TABLE anet_uuid_columns ON COMMIT DROP AS
SELECT c.table_schema, c.table_name, c.column_name
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.data_type IN ('character varying', 'text')
  AND c.column_name ~* '(^uuid$|uuid(_[ab])?$)'
  AND c.table_name IN (
    'accessTokenActivities', 'accessTokens', 'approvalSteps',
    'approvers', 'assessmentRelatedObjects', 'assessments', 'attachmentRelatedObjects',
    'attachments', 'auditTrail', 'authorizationGroupAdministrativePositions',
    'authorizationGroupRelatedObjects', 'authorizationGroups', 'comments', 'customSensitiveInformation',
    'emailAddresses', 'entityAvatars', 'eventHostRelatedObjects', 'eventOrganizations',
    'eventPeople', 'eventSeries', 'eventSeriesHostRelatedObjects', 'eventTasks',
    'eventTypes', 'events', 'locationRelationships', 'locations',
    'martImportedReports', 'mergedEntities', 'noteRelatedObjects', 'notes',
    'organizationAdministrativePositions', 'organizations', 'people', 'peoplePositions',
    'peoplePreferences', 'positionRelationships', 'positions', 'preferences',
    'reportActions', 'reportAuthorizedMembers', 'reportCommunities', 'reportPeople',
    'reportTasks', 'reports', 'reportsSensitiveInformation',
    'savedSearches', 'subscriptionUpdates', 'subscriptions',
    'taskResponsiblePositions', 'taskTaskedOrganizations', 'tasks',
    'userActivities', 'users'
  );

-- Retain definitions rather than guessing constraint names or referential actions.
CREATE TEMP TABLE anet_uuid_foreign_keys ON COMMIT DROP AS
SELECT n.nspname AS table_schema, t.relname AS table_name,
       fk.conname AS constraint_name, pg_get_constraintdef(fk.oid) AS definition
FROM pg_constraint fk
JOIN pg_class t ON t.oid = fk.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE fk.contype = 'f'
  AND EXISTS (
    SELECT 1
    FROM anet_uuid_columns c
    JOIN pg_namespace cn ON cn.nspname = c.table_schema
    JOIN pg_class ct ON ct.relnamespace = cn.oid AND ct.relname = c.table_name
    JOIN pg_attribute a ON a.attrelid = ct.oid AND a.attname = c.column_name
    WHERE (fk.conrelid = ct.oid AND a.attnum = ANY(fk.conkey))
       OR (fk.confrelid = ct.oid AND a.attnum = ANY(fk.confkey))
  );

-- The link views must be rebuilt before the full-text views that depend on them.
CREATE TEMP TABLE anet_uuid_views ON COMMIT DROP AS
SELECT schemaname, matviewname, definition, matviewowner
FROM pg_matviews
WHERE schemaname = 'public' AND matviewname ~ '^mv_(lts|fts)_';
CREATE TEMP TABLE anet_uuid_view_indexes ON COMMIT DROP AS
SELECT i.indexdef
FROM pg_indexes i
JOIN anet_uuid_views v ON v.schemaname = i.schemaname AND v.matviewname = i.tablename;

-- Rebuilding a materialized view must not discard application-role access.
CREATE TEMP TABLE anet_uuid_view_grants ON COMMIT DROP AS
SELECT v.schemaname, v.matviewname,
       CASE WHEN acl.grantee = 0 THEN 'PUBLIC'
            ELSE quote_ident(pg_get_userbyid(acl.grantee)) END AS grantee,
       acl.privilege_type, acl.is_grantable
FROM anet_uuid_views v
JOIN pg_namespace n ON n.nspname = v.schemaname
JOIN pg_class c ON c.relnamespace = n.oid AND c.relname = v.matviewname
CROSS JOIN LATERAL aclexplode(c.relacl) acl
WHERE acl.grantee <> c.relowner;

DO $migration$
DECLARE
    item record;
    default_expression text;
BEGIN
    -- Validate before dropping anything; never replace malformed IDs or break references.
    FOR item IN SELECT * FROM anet_uuid_columns LOOP
        EXECUTE format('SELECT %I::uuid FROM %I.%I WHERE %I IS NOT NULL',
            item.column_name, item.table_schema, item.table_name, item.column_name);
    END LOOP;
    FOR item IN SELECT * FROM anet_uuid_views ORDER BY matviewname LOOP
        -- mv_fts sorts before mv_lts, so dependents are dropped first, without CASCADE.
        EXECUTE format('DROP MATERIALIZED VIEW %I.%I', item.schemaname, item.matviewname);
    END LOOP;
    FOR item IN SELECT * FROM anet_uuid_foreign_keys LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I',
            item.table_schema, item.table_name, item.constraint_name);
    END LOOP;
    FOR item IN SELECT * FROM anet_uuid_columns ORDER BY table_name, column_name LOOP
        SELECT pg_get_expr(d.adbin, d.adrelid) INTO default_expression
        FROM pg_attrdef d
        JOIN pg_class t ON t.oid = d.adrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.adnum
        WHERE n.nspname = item.table_schema AND t.relname = item.table_name
          AND a.attname = item.column_name;
        EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I DROP DEFAULT',
            item.table_schema, item.table_name, item.column_name);
        EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I TYPE uuid USING %I::uuid',
            item.table_schema, item.table_name, item.column_name, item.column_name);
        IF default_expression IS NOT NULL THEN
            EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I SET DEFAULT (%s)::uuid',
                item.table_schema, item.table_name, item.column_name, default_expression);
        END IF;
    END LOOP;
    FOR item IN SELECT * FROM anet_uuid_foreign_keys LOOP
        EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I %s',
            item.table_schema, item.table_name, item.constraint_name, item.definition);
    END LOOP;
END;
$migration$;

-- Linked IDs extracted from rich text/custom fields are text, not database columns.
-- Invalid/stale links must continue to contribute no text instead of breaking a refresh.
CREATE OR REPLACE FUNCTION get_core_text(object_table text, object_uuid varchar(36))
RETURNS tsvector AS $function$
DECLARE
    result tsvector;
BEGIN
    IF object_table IS NULL OR object_uuid IS NULL THEN
        RETURN NULL;
    END IF;
    EXECUTE format('SELECT core_text FROM public.%I WHERE uuid = $1', object_table)
        INTO result USING object_uuid::uuid;
    RETURN result;
EXCEPTION WHEN invalid_text_representation THEN
    RETURN NULL;
END;
$function$ LANGUAGE plpgsql IMMUTABLE;

-- A function's table return type cannot be changed with CREATE OR REPLACE.
DROP FUNCTION get_rt_referenced_objects(text, text);
DROP FUNCTION get_cf_referenced_objects(text, text);

CREATE FUNCTION get_rt_referenced_objects(table_name text, column_name text)
RETURNS table(uuid uuid, object_table text, object_uuid text) AS $function$
BEGIN
    RETURN QUERY EXECUTE format($query$
        WITH links AS (
            SELECT uuid, regexp_matches(%I,
                '"urn:anet:(attachments|authorizationGroups|events|eventSeries|locations|organizations|people|positions|reports|tasks):([^"]*)"',
                'g') AS arr FROM public.%I
        )
        SELECT uuid, arr[1], arr[2] FROM links
    $query$, column_name, table_name);
END;
$function$ LANGUAGE plpgsql IMMUTABLE;

CREATE FUNCTION get_cf_referenced_objects(table_name text, column_name text)
RETURNS table(uuid uuid, object_table text, object_uuid text) AS $function$
BEGIN
    RETURN QUERY EXECUTE format($query$
        WITH links AS (
            SELECT uuid, regexp_matches(%I,
                '\\"urn:anet:(attachments|authorizationGroups|events|eventSeries|locations|organizations|people|positions|reports|tasks):([^\\]*)\\"|{"type":"(Attachment|AuthorizationGroup|Event|EventSeries|Location|Organization|Person|Position|Report|Task)","uuid":"([^"]*)"}',
                'g') AS arr FROM public.%I
        )
        SELECT uuid,
            CASE WHEN arr[1] IS NOT NULL THEN arr[1] ELSE
                CASE arr[3]
                    WHEN 'Attachment' THEN 'attachments'
                    WHEN 'AuthorizationGroup' THEN 'authorizationGroups'
                    WHEN 'Event' THEN 'events'
                    WHEN 'EventSeries' THEN 'eventSeries'
                    WHEN 'Location' THEN 'locations'
                    WHEN 'Organization' THEN 'organizations'
                    WHEN 'Person' THEN 'people'
                    WHEN 'Position' THEN 'positions'
                    WHEN 'Report' THEN 'reports'
                    WHEN 'Task' THEN 'tasks'
                END
            END,
            CASE WHEN arr[2] IS NOT NULL THEN arr[2] ELSE arr[4] END
        FROM links
    $query$, column_name, table_name);
END;
$function$ LANGUAGE plpgsql IMMUTABLE;

DO $migration$
DECLARE
    item record;
BEGIN
    FOR item IN SELECT * FROM anet_uuid_views ORDER BY matviewname DESC LOOP
        EXECUTE format('CREATE MATERIALIZED VIEW %I.%I AS %s',
            item.schemaname, item.matviewname, item.definition);
        EXECUTE format('ALTER MATERIALIZED VIEW %I.%I OWNER TO %I',
            item.schemaname, item.matviewname, item.matviewowner);
    END LOOP;
    FOR item IN SELECT * FROM anet_uuid_view_indexes LOOP
        -- pg_trgm indexes text expressions, while view UUID columns stay native uuid.
        EXECUTE replace(item.indexdef, 'USING gin (uuid gin_trgm_ops)',
            'USING gin ((uuid::text) gin_trgm_ops)');
    END LOOP;
    FOR item IN SELECT * FROM anet_uuid_view_grants LOOP
        EXECUTE format('GRANT %s ON TABLE %I.%I TO %s%s',
            item.privilege_type, item.schemaname, item.matviewname, item.grantee,
            CASE WHEN item.is_grantable THEN ' WITH GRANT OPTION' ELSE '' END);
    END LOOP;
END;
$migration$;

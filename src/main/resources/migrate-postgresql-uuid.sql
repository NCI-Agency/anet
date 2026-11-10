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
    -- The final full-text-search changeset rebuilds these views with native UUIDs.
    FOR item IN SELECT schemaname, matviewname FROM pg_matviews
        WHERE schemaname = 'public' AND matviewname ~ '^mv_(lts|fts)_'
        ORDER BY matviewname LOOP
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

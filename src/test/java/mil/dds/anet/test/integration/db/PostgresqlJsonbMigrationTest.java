package mil.dds.anet.test.integration.db;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import liquibase.Contexts;
import liquibase.LabelExpression;
import liquibase.Liquibase;
import liquibase.database.DatabaseFactory;
import liquibase.database.jvm.JdbcConnection;
import liquibase.exception.LiquibaseException;
import liquibase.resource.DirectoryResourceAccessor;
import mil.dds.anet.beans.Assessment;
import mil.dds.anet.beans.CustomSensitiveInformation;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.PhoneNumber;
import mil.dds.anet.beans.SavedSearch;
import mil.dds.anet.config.JdbiConfig;
import mil.dds.anet.database.AssessmentDao;
import mil.dds.anet.database.CustomSensitiveInformationDao;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.database.EmailDao;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.SavedSearchDao;
import mil.dds.anet.database.cache.PersonCache;
import org.jdbi.v3.core.Jdbi;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.postgresql.ds.PGSimpleDataSource;

/**
 * Opt-in tests using ANET_JSONB_MIGRATION_TEST_URL (jdbc:postgresql://host:port/postgres),
 * ANET_JSONB_MIGRATION_TEST_USER and ANET_JSONB_MIGRATION_TEST_PASSWORD. Only randomly named test
 * databases on this explicitly configured disposable server are migrated and dropped.
 */
class PostgresqlJsonbMigrationTest {
  private static final List<String[]> JSON_COLUMNS =
      List.of(new String[] {"locations", "customFields"},
          new String[] {"organizations", "customFields"}, new String[] {"people", "customFields"},
          new String[] {"positions", "customFields"}, new String[] {"reports", "customFields"},
          new String[] {"tasks", "customFields"}, new String[] {"assessments", "assessmentValues"},
          new String[] {"customSensitiveInformation", "customFieldValue"},
          new String[] {"people", "phoneNumber"}, new String[] {"savedSearches", "query"},
          new String[] {"pendingEmails", "jobSpec"});
  private static String url;
  private static String username;
  private static String password;
  private static String baselineDatabase;
  private static Path resources;
  private static Path baselineResources;

  @BeforeAll
  static void prepareBaseline() throws Exception {
    url = System.getenv("ANET_JSONB_MIGRATION_TEST_URL");
    Assumptions.assumeTrue(url != null, "Requires an explicitly configured disposable PostgreSQL");
    assertTrue(url.startsWith("jdbc:postgresql://") && url.endsWith("/postgres"));
    username = System.getenv("ANET_JSONB_MIGRATION_TEST_USER");
    password = System.getenv("ANET_JSONB_MIGRATION_TEST_PASSWORD");
    resources = Files.createTempDirectory("anet-jsonb-changelog-");
    baselineResources = Files.createTempDirectory("anet-jsonb-baseline-");
    final String migrations = resource("migrations.xml");
    final int start = migrations.indexOf("\t<changeSet id=\"postgresql-native-jsonb\"");
    assertTrue(start > migrations.indexOf("id=\"postgresql-native-uuid\""));
    assertEquals(migrations.lastIndexOf("<changeSet "),
        migrations.indexOf("<changeSet id=\"set-up-full-text-search\""));
    final int end = migrations.indexOf("</changeSet>", start) + "</changeSet>".length();
    for (Path directory : List.of(resources, baselineResources)) {
      for (String name : List.of("db-changelog.yml", "prepare-psql.sql",
          "migrate-postgresql-uuid.sql", "migrate-postgresql-jsonb.sql")) {
        Files.writeString(directory.resolve(name), resource(name).replace("classpath:", ""));
      }
    }
    Files.writeString(resources.resolve("migrations.xml"), migrations);
    Files.writeString(resources.resolve("db-changelog-dev.yml"),
        Files.readString(Path.of("db-changelog-dev.yml")).replace("classpath:", "")
            .replace("file:insertBaseData-psql.sql", "insertBaseData-psql.sql"));
    String developmentData = Files.readString(Path.of("insertBaseData-psql.sql"));
    // Load the same attachments without requiring files on the disposable PostgreSQL server.
    for (String asset : List.of("default_avatar.png", "organization_avatar1.svg",
        "organization_avatar2.svg")) {
      final String content = Base64.getEncoder()
          .encodeToString(Files.readAllBytes(Path.of("src/test/resources/assets", asset)));
      developmentData = developmentData.replace("lo_import('/var/tmp/assets/" + asset + "')",
          "lo_from_bytea(0, decode('" + content + "', 'base64'))");
    }
    Files.writeString(resources.resolve("insertBaseData-psql.sql"), developmentData);
    final String baseline = migrations.substring(0, start) + migrations.substring(end);
    final int functionStart =
        baseline.lastIndexOf("\t\t\tCREATE OR REPLACE FUNCTION get_cf_referenced_objects(");
    final int functionEnd =
        baseline.indexOf("\n\t\t\t<!-- Add generated core_text columns -->", functionStart + 1);
    Files.writeString(baselineResources.resolve("migrations.xml"),
        baseline.substring(0, functionStart) + resource("postgresql-jsonb-baseline-full-text.sql")
            + baseline.substring(functionEnd));
    baselineDatabase = newDatabaseName();
    createDatabase(baselineDatabase, false);
    try (Connection connection = connect(baselineDatabase)) {
      migrate(connection, baselineResources);
    }
  }

  @AfterAll
  static void cleanup() throws Exception {
    if (baselineDatabase != null) {
      dropDatabase(baselineDatabase);
    }
    for (Path directory : new Path[] {resources, baselineResources}) {
      if (directory != null) {
        deleteResources(directory);
      }
    }
  }

  @Test
  void upgradesAllJsonColumnsPreservingValuesDefaultsConstraintsAndSearch() throws Exception {
    withDatabase(true, connection -> {
      seed(connection);
      final List<String> constraints = foreignKeys(connection);
      final List<Integer> rowCounts = new ArrayList<>();
      for (String[] column : JSON_COLUMNS) {
        rowCounts.add(number(connection, "SELECT count(*) FROM " + quoted(column[0])));
      }
      final int locationCount = number(connection, "SELECT count(*) FROM locations");
      final int viewCount = number(connection, "SELECT count(*) FROM pg_matviews");
      final int indexCount = number(connection, "SELECT count(*) FROM pg_indexes "
          + "WHERE schemaname='public' AND tablename ~ '^mv_(lts|fts)_'");
      for (String[] column : JSON_COLUMNS) {
        execute(connection, "ALTER TABLE " + quoted(column[0]) + " ALTER COLUMN "
            + quoted(column[1]) + " SET DEFAULT '{\"default\":true}'");
        execute(connection, "UPDATE " + quoted(column[0]) + " SET " + quoted(column[1])
            + "='{\"value\":[1,true,null,\"JSON migration\"],\"nested\":{\"x\":2}}'");
      }
      execute(connection,
          "UPDATE locations SET \"geoJson\"='not JSON: future PostGIS Geometry type'");
      migrate(connection, resources);
      assertNativeColumns(connection);
      assertEquals(constraints, foreignKeys(connection));
      assertEquals(viewCount, number(connection, "SELECT count(*) FROM pg_matviews"));
      assertEquals(indexCount, number(connection, "SELECT count(*) FROM pg_indexes "
          + "WHERE schemaname='public' AND tablename ~ '^mv_(lts|fts)_'"));
      for (int i = 0; i < JSON_COLUMNS.size(); i++) {
        final String[] column = JSON_COLUMNS.get(i);
        assertEquals(rowCounts.get(i),
            number(connection, "SELECT count(*) FROM " + quoted(column[0])));
        final String field = quoted(column[1]);
        assertEquals(0,
            number(connection, "SELECT count(*) FROM " + quoted(column[0]) + " WHERE " + field
                + " IS DISTINCT FROM "
                + "'{\"nested\":{\"x\":2},\"value\":[1,true,null,\"JSON migration\"]}'::jsonb"));
        assertEquals(1,
            number(connection,
                "SELECT count(*) FROM information_schema.columns "
                    + "WHERE table_schema='public' AND table_name='" + column[0]
                    + "' AND column_name='" + column[1] + "' AND column_default LIKE '%jsonb%'"));
      }
      assertEquals(locationCount, number(connection, "SELECT count(*) FROM locations "
          + "WHERE \"geoJson\"='not JSON: future PostGIS Geometry type'"));
      assertEquals(locationCount, number(connection, "SELECT count(*) FROM mv_fts_locations "
          + "WHERE full_text @@ to_tsquery('simple', 'migration')"));
      execute(connection, "INSERT INTO locations (uuid, name, type) VALUES ('" + UUID.randomUUID()
          + "', 'Default JSON', 'COUNTRY')");
      assertEquals(1, number(connection,
          "SELECT count(*) FROM locations WHERE \"customFields\"='{\"default\":true}'::jsonb"));
      migrate(connection, resources);
      assertEquals(1, number(connection,
          "SELECT count(*) FROM databasechangelog WHERE id='postgresql-native-jsonb'"));
    });
  }

  @Test
  void conversionPreservesSqlNullJsonNullAndScalarValues() throws Exception {
    withDatabase(true, connection -> {
      final String[] values = new String[] {null, "null", "{}", "[]", "\"text\"", "12.5", "true",
          "{\"key\":1,\"key\":2}"};
      final List<String> ids = new ArrayList<>();
      for (String value : values) {
        final String id = UUID.randomUUID().toString();
        ids.add(id);
        execute(connection, "INSERT INTO \"savedSearches\" (uuid,query) VALUES ('" + id + "',"
            + (value == null ? "NULL" : "'" + value + "'") + ")");
      }
      migrate(connection, resources);
      for (int i = 0; i < values.length; i++) {
        final String value = values[i];
        assertEquals(1,
            number(connection,
                "SELECT count(*) FROM \"savedSearches\" WHERE uuid='" + ids.get(i)
                    + "' AND query IS NOT DISTINCT FROM "
                    + (value == null ? "NULL" : "'" + value + "'::jsonb")));
      }
      assertEquals("{\"key\": 2}", scalar(connection,
          "SELECT query FROM \"savedSearches\" WHERE uuid='" + ids.get(values.length - 1) + "'"));
    });
  }

  @Test
  void malformedJsonRollsBackAndCanBeRepaired() throws Exception {
    // Blank JSON and JSON accepted by json but not jsonb must not silently disappear either.
    for (String invalid : List.of("{secret-broken", " ", "{\"value\":\"\\u0000\"}")) {
      withDatabase(true, connection -> {
        seed(connection);
        execute(connection,
            "ALTER TABLE \"savedSearches\" ALTER COLUMN \"query\" SET DEFAULT '{}'::text");
        execute(connection, "UPDATE \"savedSearches\" SET \"query\"='" + invalid + "'");
        final int rowCount = number(connection, "SELECT count(*) FROM \"savedSearches\"");
        final int viewCount = number(connection, "SELECT count(*) FROM pg_matviews");
        final int generatedCount = number(connection,
            "SELECT count(*) FROM information_schema.columns WHERE is_generated='ALWAYS'");
        final var error =
            assertThrows(LiquibaseException.class, () -> migrate(connection, resources));
        assertTrue(error.getMessage().contains("savedSearches.query"));
        assertFalse(error.getMessage().contains("secret-broken"));
        assertEquals(1,
            number(connection,
                "SELECT count(*) FROM information_schema.columns "
                    + "WHERE table_schema='public' AND table_name='savedSearches' "
                    + "AND column_name='query' AND column_default IS NOT NULL"));
        assertEquals(viewCount, number(connection, "SELECT count(*) FROM pg_matviews"));
        assertEquals(generatedCount, number(connection,
            "SELECT count(*) FROM information_schema.columns WHERE is_generated='ALWAYS'"));
        assertEquals(0, number(connection, "SELECT count(*) FROM information_schema.columns "
            + "WHERE table_schema='public' AND data_type='jsonb'"));
        assertEquals(rowCount, number(connection,
            "SELECT count(*) FROM \"savedSearches\" " + "WHERE \"query\"='" + invalid + "'"));
        assertEquals(0, number(connection,
            "SELECT count(*) FROM databasechangelog WHERE id='postgresql-native-jsonb'"));
        execute(connection, "UPDATE \"savedSearches\" SET \"query\"='{}'");
        migrate(connection, resources);
        assertNativeColumns(connection);
      });
    }
  }

  @Test
  void unrelatedDependenciesAreNotDroppedByCascade() throws Exception {
    withDatabase(true, connection -> {
      seed(connection);
      execute(connection,
          "CREATE VIEW customer_json_view AS SELECT \"customFields\" FROM locations");
      final int viewCount = number(connection, "SELECT count(*) FROM pg_matviews");
      final int rowCount = number(connection, "SELECT count(*) FROM locations");
      assertThrows(LiquibaseException.class, () -> migrate(connection, resources));
      assertEquals(viewCount, number(connection, "SELECT count(*) FROM pg_matviews"));
      assertEquals(rowCount, number(connection, "SELECT count(*) FROM customer_json_view"));
      assertEquals(0, number(connection, "SELECT count(*) FROM information_schema.columns "
          + "WHERE table_schema='public' AND data_type='jsonb'"));
      execute(connection, "DROP VIEW customer_json_view");
      migrate(connection, resources);
      assertNativeColumns(connection);
    });
  }

  @Test
  void structuredAndRichTextLinksSurviveCanonicalizationAndFullTextRerun() throws Exception {
    withDatabase(true, connection -> {
      seed(connection);
      final String location = scalar(connection, "SELECT uuid FROM locations LIMIT 1");
      execute(connection, "UPDATE locations SET name='JsonbLinkedLand'");
      final String json = "{\"links\":[{\"extra\":true, \"uuid\":\"" + location
          + "\", \"type\":\"Location\"}],\"html\":\"<a href=\\\"urn:anet:locations:" + location
          + "\\\">rich text</a>\",\"unknown\":{\"type\":\"Other\",\"uuid\":\"bad\"},"
          + "\"broken\":{\"type\":\"Location\",\"uuid\":\"invalid\"}}";
      execute(connection, "UPDATE people SET \"customFields\"='" + json + "'");
      migrate(connection, resources);
      assertLinks(connection, location);
      final Path rerun = fullTextResources("SELECT 1;");
      try {
        migrate(connection, rerun);
        assertNativeColumns(connection);
        assertLinks(connection, location);
      } finally {
        deleteResources(rerun);
      }
    });
  }

  @Test
  void applicationDaosAndStringBindingsRoundTripNativeJson() throws Exception {
    withDatabase(true, connection -> {
      seed(connection);
      migrate(connection, resources);
      final PGSimpleDataSource dataSource = new PGSimpleDataSource();
      dataSource.setURL(connection.getMetaData().getURL());
      dataSource.setUser(username);
      dataSource.setPassword(password);
      final Jdbi jdbi = new JdbiConfig().jdbi(dataSource);
      // Each target supports serialized JSON and SQL NULL through the existing String argument.
      jdbi.useHandle(handle -> {
        for (String[] column : JSON_COLUMNS) {
          final String table = quoted(column[0]);
          final String field = quoted(column[1]);
          for (String json : List.of("null", "{}", "[]", "\"text\"", "12.5", "true")) {
            handle.createUpdate("UPDATE " + table + " SET " + field + "=:json").bind("json", json)
                .execute();
            assertTrue(handle.createQuery("SELECT bool_and(" + field + "=:json) FROM " + table)
                .bind("json", json).mapTo(Boolean.class).one());
            assertNotNull(handle.createQuery("SELECT " + field + " FROM " + table + " LIMIT 1")
                .mapTo(String.class).one());
          }
          handle.createUpdate("UPDATE " + table + " SET " + field + "=:json")
              .bind("json", (String) null).execute();
          assertEquals(0,
              handle
                  .createQuery("SELECT count(*) FROM " + table + " WHERE " + field + " IS NOT NULL")
                  .mapTo(Integer.class).one());
        }
      });
      final DatabaseHandler handler = new DatabaseHandler(jdbi);
      final PersonDao people = new PersonDao(handler, mock(PersonCache.class));
      final Person person = new Person();
      person.setFamilyName("Native JSON phone test");
      person.setPhoneNumber(List.of(new PhoneNumber("mobile", "+31 123456789")));
      people.insert(person);
      assertEquals(person.getPhoneNumber(), people.getByUuid(person.getUuid()).getPhoneNumber());
      person.setPhoneNumber(List.of(new PhoneNumber("office", "+31 987654321")));
      assertEquals(1, people.update(person));
      assertEquals(person.getPhoneNumber(), people.getByUuid(person.getUuid()).getPhoneNumber());
      final CustomSensitiveInformationDao sensitive = new CustomSensitiveInformationDao(handler);
      final CustomSensitiveInformation csi = new CustomSensitiveInformation();
      csi.setCustomFieldName("jsonb-application-test");
      csi.setRelatedObjectType("people");
      csi.setRelatedObjectUuid(person.getUuid());
      csi.setCustomFieldValue("{\"value\":42}");
      sensitive.insert(csi);
      assertEquals("{\"value\": 42}", sensitive.getByUuid(csi.getUuid()).getCustomFieldValue());
      csi.setCustomFieldValue("{\"value\":43}");
      assertEquals(1, sensitive.update(csi));
      assertEquals("{\"value\": 43}", sensitive.getByUuid(csi.getUuid()).getCustomFieldValue());
      final LocationDao locations = new LocationDao(handler);
      final Location location = new Location();
      location.setName("Native JSON application test");
      location.setType(Location.LocationType.COUNTRY);
      location.setStatus(Location.Status.ACTIVE);
      location.setCustomFields("{\"answer\":42}");
      locations.insert(location);
      assertEquals("{\"answer\": 42}", locations.getByUuid(location.getUuid()).getCustomFields());
      location.setCustomFields("{\"answer\":43}");
      assertEquals(1, locations.update(location));
      assertEquals("{\"answer\": 43}", locations.getByUuid(location.getUuid()).getCustomFields());
      final SavedSearchDao searches = new SavedSearchDao(handler);
      final SavedSearch saved = new SavedSearch();
      saved.setName("Native JSON saved search");
      saved.setObjectType(SavedSearch.SearchObjectType.LOCATIONS);
      saved.setOwnerUuid(scalar(connection, "SELECT uuid FROM people LIMIT 1"));
      saved.setQuery("{\"text\":\"search\"}");
      searches.insert(saved);
      assertEquals("{\"text\": \"search\"}", searches.getByUuid(saved.getUuid()).getQuery());
      final AssessmentDao assessments = new AssessmentDao(handler);
      final Assessment assessment = new Assessment();
      assessment.setAuthorUuid(saved.getOwnerUuid());
      assessment.setAssessmentRelatedObjects(List.of());
      assessment.setAssessmentKey("jsonb-test");
      assessment.setAssessmentValues("{\"status\":\"ready\",\"options\":[\"a\",\"b\"],"
          + "\"assessmentDate\":\"2026-01-01\"}");
      assessments.insert(assessment);
      assertNotNull(assessments.getByUuid(assessment.getUuid()).getAssessmentValues());
      jdbi.useHandle(handle -> assertTrue(handle
          .createQuery("SELECT \"assessmentValues\"->>'status'=:status AND "
              + "\"assessmentValues\"->'options' ??| array[:option] AND "
              + "(\"assessmentValues\"->>'assessmentDate')::date=DATE '2026-01-01' "
              + "FROM assessments WHERE uuid=:uuid")
          .bind("status", "ready").bind("option", "a").bind("uuid", assessment.getUuid())
          .mapTo(Boolean.class).one()));
      assessment.setAssessmentValues("{\"status\":\"updated\"}");
      assertEquals(1, assessments.update(assessment));
      assertEquals("{\"status\": \"updated\"}",
          assessments.getByUuid(assessment.getUuid()).getAssessmentValues());
      new EmailDao(handler).createPendingEmail("{\"comment\":\"Native JSON email\"}");
      assertEquals(1, number(connection, "SELECT count(*) FROM \"pendingEmails\" "
          + "WHERE \"jobSpec\"->>'comment'='Native JSON email'"));
    });
  }

  @Test
  void freshInstallUsesJsonbButLeavesGeoJsonAndPlainTextAlone() throws Exception {
    withDatabase(false, connection -> {
      migrate(connection, resources);
      assertNativeColumns(connection);
      assertEquals(4,
          number(connection, "SELECT count(*) FROM information_schema.columns "
              + "WHERE table_schema='public' AND data_type IN ('text','character varying') AND "
              + "((table_name='preferences' AND column_name IN ('allowedValues','defaultValue')) "
              + "OR (table_name='auditTrail' AND column_name='updateDetails') "
              + "OR (table_name='peoplePreferences' AND column_name='value'))"));
    });
  }

  @Test
  void developmentChangelogLoadsPeriodicAssessmentsIntoJsonb() throws Exception {
    withDatabase(false, connection -> {
      migrate(connection, resources, "db-changelog-dev.yml");
      assertNativeColumns(connection);
      assertEquals(10, number(connection,
          "SELECT count(*) FROM assessments WHERE \"assessmentValues\" ? '__periodStart'"));
      assertEquals(10,
          number(connection,
              "SELECT count(*) FROM assessments WHERE "
                  + "jsonb_typeof(\"assessmentValues\"->'__periodStart')='string' "
                  + "AND \"assessmentValues\"->>'__periodStart' ~ '^\\d{4}-\\d{2}-\\d{2}$'"));
      assertEquals(
          scalar(connection,
              "SELECT to_char(date_trunc('month', CURRENT_TIMESTAMP) "
                  + "+ INTERVAL '-1 month', 'YYYY-MM-DD')"),
          scalar(connection, "SELECT \"assessmentValues\"->>'__periodStart' FROM assessments "
              + "WHERE uuid='be9fdb3c-2bc1-412a-aca9-cc009cbd3314'"));
      assertEquals("GREEN",
          scalar(connection, "SELECT \"assessmentValues\"->>'status' FROM assessments "
              + "WHERE uuid='be9fdb3c-2bc1-412a-aca9-cc009cbd3314'"));
      assertEquals("1",
          scalar(connection,
              "SELECT \"assessmentValues\" #>> '{questionSets,topLevelQs,questionSets,"
                  + "bottomLevelQs,questions,test3}' FROM assessments "
                  + "WHERE uuid='04daee89-c3d4-4b6d-8b9b-5c3cc50e2883'"));
      assertTrue(number(connection, "SELECT count(*) FROM mv_fts_people") > 0);
      assertEquals(1, number(connection,
          "SELECT count(*) FROM databasechangelog WHERE id='data' AND author='system'"));
    });
  }

  @Test
  void failedFullTextRebuildCanResumeAfterJsonConversionCommits() throws Exception {
    final String name = newDatabaseName();
    createDatabase(name, true);
    final Path failedResources = fullTextResources("SELECT 1 / 0;");
    try {
      try (Connection connection = connect(name)) {
        assertThrows(LiquibaseException.class, () -> migrate(connection, failedResources));
        assertNativeColumns(connection);
        assertEquals(0, number(connection, "SELECT count(*) FROM pg_matviews"));
      }
      try (Connection connection = connect(name)) {
        migrate(connection, resources);
        assertNativeColumns(connection);
        assertEquals(19, number(connection, "SELECT count(*) FROM pg_matviews"));
      }
    } finally {
      deleteResources(failedResources);
      dropDatabase(name);
    }
  }

  private static void assertNativeColumns(Connection connection) throws SQLException {
    for (String[] column : JSON_COLUMNS) {
      assertEquals(1,
          number(connection,
              "SELECT count(*) FROM information_schema.columns "
                  + "WHERE table_schema='public' AND data_type='jsonb' AND table_name='" + column[0]
                  + "' AND column_name='" + column[1] + "'"));
    }
    assertEquals(1,
        number(connection, "SELECT count(*) FROM information_schema.columns "
            + "WHERE table_schema='public' AND table_name='locations' AND column_name='geoJson' "
            + "AND data_type='text'"));
  }

  private static void assertLinks(Connection connection, String location) throws SQLException {
    final int people = number(connection, "SELECT count(*) FROM people");
    assertEquals(people * 2,
        number(connection,
            "SELECT count(*) FROM get_cf_referenced_objects('people', 'customFields') "
                + "WHERE object_table='locations' AND object_uuid='" + location + "'"));
    assertEquals(people * 3, number(connection,
        "SELECT count(*) FROM get_cf_referenced_objects('people', 'customFields')"));
    assertEquals(people, number(connection, "SELECT count(*) FROM mv_fts_people "
        + "WHERE full_text @@ to_tsquery('simple', 'jsonblinkedland')"));
  }

  private static void seed(Connection connection) throws SQLException {
    final String person = UUID.randomUUID().toString();
    for (String table : List.of("locations", "organizations", "people", "tasks", "savedSearches")) {
      execute(connection,
          "INSERT INTO " + quoted(table)
              + (table.equals("locations") ? " (uuid, name, type)" : " (uuid)") + " VALUES ('"
              + (table.equals("people") ? person : UUID.randomUUID())
              + (table.equals("locations") ? "', 'JSON location', 'COUNTRY')" : "')"));
    }
    execute(connection, "INSERT INTO positions (uuid,name,type) VALUES ('" + UUID.randomUUID()
        + "','JSON position',0)");
    execute(connection, "INSERT INTO reports (uuid,state) VALUES ('" + UUID.randomUUID() + "',0)");
    execute(connection, "INSERT INTO assessments (uuid,\"authorUuid\") VALUES ('"
        + UUID.randomUUID() + "','" + person + "')");
    execute(connection,
        "INSERT INTO \"customSensitiveInformation\" "
            + "(uuid,\"customFieldName\",\"relatedObjectType\",\"relatedObjectUuid\") VALUES ('"
            + UUID.randomUUID() + "','jsonb-test','people','" + person + "')");
    execute(connection, "INSERT INTO \"pendingEmails\" (\"jobSpec\") VALUES ('{}')");
  }

  private static String quoted(String identifier) {
    return "\"" + identifier + "\"";
  }

  private static String scalar(Connection connection, String sql) throws SQLException {
    try (var statement = connection.createStatement(); var rows = statement.executeQuery(sql)) {
      rows.next();
      return rows.getString(1);
    }
  }

  private static Path fullTextResources(String extraSql) throws Exception {
    final Path directory = Files.createTempDirectory("anet-jsonb-fts-rerun-");
    try (var files = Files.list(resources)) {
      for (Path file : files.toList()) {
        Files.copy(file, directory.resolve(file.getFileName()));
      }
    }
    // A SQL change (not just a comment or cleared checksum) forces runOnChange to execute.
    final Path changelog = directory.resolve("migrations.xml");
    final String migrations = Files.readString(changelog);
    final int end = migrations.lastIndexOf("</sql>");
    Files.writeString(changelog,
        migrations.substring(0, end) + extraSql + "\n" + migrations.substring(end));
    return directory;
  }

  private static void deleteResources(Path directory) throws Exception {
    try (var files = Files.list(directory)) {
      for (Path file : files.toList()) {
        Files.delete(file);
      }
    }
    Files.delete(directory);
  }

  private static List<String> foreignKeys(Connection connection) throws SQLException {
    final List<String> result = new ArrayList<>();
    try (var statement = connection.createStatement();
        var rows = statement.executeQuery("SELECT conname || ':' || pg_get_constraintdef(oid) "
            + "FROM pg_constraint WHERE contype='f' ORDER BY conname")) {
      while (rows.next()) {
        result.add(rows.getString(1));
      }
    }
    return result;
  }

  private static int number(Connection connection, String sql) throws SQLException {
    try (var statement = connection.createStatement(); var rows = statement.executeQuery(sql)) {
      rows.next();
      return rows.getInt(1);
    }
  }

  private static void execute(Connection connection, String sql) throws SQLException {
    try (var statement = connection.createStatement()) {
      statement.execute(sql);
    }
  }

  private static String resource(String name) throws Exception {
    try (var stream =
        PostgresqlJsonbMigrationTest.class.getClassLoader().getResourceAsStream(name)) {
      assertNotNull(stream, name);
      return new String(stream.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
    }
  }

  private static void migrate(Connection connection, Path directory) throws Exception {
    migrate(connection, directory, "db-changelog.yml");
  }

  private static void migrate(Connection connection, Path directory, String changelog)
      throws Exception {
    final boolean autoCommit = connection.getAutoCommit();
    final var database = DatabaseFactory.getInstance()
        .findCorrectDatabaseImplementation(new JdbcConnection(connection));
    try (var accessor = new DirectoryResourceAccessor(directory)) {
      final var liquibase = new Liquibase(changelog, accessor, database);
      liquibase.update(new Contexts(), new LabelExpression());
    } finally {
      connection.setAutoCommit(autoCommit);
    }
  }

  private static Connection connect(String database) throws SQLException {
    return DriverManager.getConnection(url.substring(0, url.lastIndexOf('/') + 1) + database,
        username, password);
  }

  private static String newDatabaseName() {
    return "anet_jsonb_test_" + UUID.randomUUID().toString().replace("-", "");
  }

  private static void createDatabase(String name, boolean copyBaseline) throws SQLException {
    try (Connection admin = connect("postgres")) {
      execute(admin,
          "CREATE DATABASE " + name + (copyBaseline ? " TEMPLATE " + baselineDatabase : ""));
    }
  }

  private static void dropDatabase(String name) throws SQLException {
    try (Connection admin = connect("postgres")) {
      execute(admin, "DROP DATABASE IF EXISTS " + name);
    }
  }

  private static void withDatabase(boolean copyBaseline, DatabaseTest test) throws Exception {
    final String name = newDatabaseName();
    createDatabase(name, copyBaseline);
    try (Connection connection = connect(name)) {
      test.run(connection);
    } finally {
      dropDatabase(name);
    }
  }

  @FunctionalInterface
  private interface DatabaseTest {
    void run(Connection connection) throws Exception;
  }
}

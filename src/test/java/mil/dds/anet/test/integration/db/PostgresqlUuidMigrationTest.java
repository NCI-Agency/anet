package mil.dds.anet.test.integration.db;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import liquibase.Contexts;
import liquibase.LabelExpression;
import liquibase.Liquibase;
import liquibase.database.DatabaseFactory;
import liquibase.database.jvm.JdbcConnection;
import liquibase.exception.LiquibaseException;
import liquibase.resource.DirectoryResourceAccessor;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.SavedSearch;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.search.FkBatchParams;
import mil.dds.anet.beans.search.ISearchQuery.RecurseStrategy;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.config.JdbiConfig;
import mil.dds.anet.database.AdminDao;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.database.ForeignKeyBatcher;
import mil.dds.anet.database.ForeignKeyByDateBatcher;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.SavedSearchDao;
import mil.dds.anet.database.SearchQueryBatcher;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.database.mappers.LocationMapper;
import mil.dds.anet.search.pg.PostgresqlReportSearcher;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.jdbi.v3.core.Jdbi;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.postgresql.ds.PGSimpleDataSource;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * Opt-in database tests. Set ANET_UUID_MIGRATION_TEST_URL to a disposable PostgreSQL server's
 * jdbc:postgresql://host:port/postgres URL, plus ANET_UUID_MIGRATION_TEST_USER and
 * ANET_UUID_MIGRATION_TEST_PASSWORD. Only randomly named test databases are migrated and dropped.
 */
class PostgresqlUuidMigrationTest {
  private static String url;
  private static String username;
  private static String password;
  private static String baselineDatabase;
  private static Path resources;
  private static Path baselineResources;

  @BeforeAll
  static void prepareBaseline() throws Exception {
    url = System.getenv("ANET_UUID_MIGRATION_TEST_URL");
    Assumptions.assumeTrue(url != null, "Requires an explicitly configured disposable PostgreSQL");
    assertTrue(url.startsWith("jdbc:postgresql://") && url.endsWith("/postgres"));
    username = System.getenv("ANET_UUID_MIGRATION_TEST_USER");
    password = System.getenv("ANET_UUID_MIGRATION_TEST_PASSWORD");
    resources = Files.createTempDirectory("anet-uuid-changelog-");
    baselineResources = Files.createTempDirectory("anet-uuid-baseline-");
    final String migrations = resource("migrations.xml");
    final int start = migrations.indexOf("\t<changeSet id=\"postgresql-native-uuid\"");
    assertTrue(start > 0);
    final int end = migrations.indexOf("</changeSet>", start) + "</changeSet>".length();
    for (Path directory : List.of(resources, baselineResources)) {
      // DirectoryResourceAccessor resolves relative paths, not Spring's classpath: prefix.
      Files.writeString(directory.resolve("db-changelog.yml"),
          resource("db-changelog.yml").replace("classpath:", ""));
      Files.writeString(directory.resolve("prepare-psql.sql"), resource("prepare-psql.sql"));
    }
    Files.writeString(resources.resolve("migrations.xml"), migrations);
    Files.writeString(resources.resolve("migrate-postgresql-uuid.sql"),
        resource("migrate-postgresql-uuid.sql"));
    Files.writeString(baselineResources.resolve("migrations.xml"),
        migrations.substring(0, start) + migrations.substring(end));
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
        try (var files = Files.list(directory)) {
          for (Path file : files.toList()) {
            Files.delete(file);
          }
        }
        Files.delete(directory);
      }
    }
  }

  @Test
  void upgradesIdentifiersReferencesSearchAndStringBindings() throws Exception {
    withDatabase(true, connection -> {
      final String location = UUID.randomUUID().toString();
      final String person = UUID.randomUUID().toString();
      execute(connection, "INSERT INTO locations (uuid, name, type) VALUES ('" + location
          + "', 'Migrationland', 'COUNTRY')");
      execute(connection,
          "INSERT INTO people (uuid, \"countryUuid\", \"familyName\", biography) " + "VALUES ('"
              + person + "', '" + location + "', 'Migrationperson', "
              + "'<a href=\"urn:anet:locations:" + location + "\">link</a> "
              + "<a href=\"urn:anet:locations:invalid-uuid\">broken link</a>')");
      execute(connection,
          "INSERT INTO \"reportActions\" (\"personUuid\") VALUES ('" + person + "')");
      execute(connection,
          "ALTER TABLE people ALTER COLUMN uuid SET DEFAULT uuid_generate_v4()::text");
      execute(connection,
          "UPDATE people SET \"customFields\"='{\"linked\":{\"type\":\"Location\",\"uuid\":\""
              + location + "\"}}' WHERE uuid='" + person + "'");
      execute(connection, "GRANT SELECT ON mv_lts_people TO PUBLIC");
      final List<String> foreignKeys = foreignKeys(connection);
      final int viewCount =
          number(connection, "SELECT count(*) FROM pg_matviews WHERE schemaname='public'");
      final int indexCount =
          number(connection, "SELECT count(*) FROM pg_indexes WHERE schemaname='public' "
              + "AND tablename ~ '^mv_(lts|fts)_'");
      migrate(connection, resources);
      assertNativeColumns(connection);
      assertEquals(foreignKeys, foreignKeys(connection));
      assertEquals(viewCount,
          number(connection, "SELECT count(*) FROM pg_matviews WHERE schemaname='public'"));
      assertEquals(indexCount,
          number(connection, "SELECT count(*) FROM pg_indexes WHERE schemaname='public' "
              + "AND tablename ~ '^mv_(lts|fts)_'"));
      assertEquals(1,
          number(connection,
              "SELECT count(*) FROM pg_class c, LATERAL aclexplode(c.relacl) acl "
                  + "WHERE c.oid='mv_lts_people'::regclass AND acl.grantee=0 "
                  + "AND acl.privilege_type='SELECT'"));
      final PGSimpleDataSource dataSource = new PGSimpleDataSource();
      dataSource.setURL(connection.getMetaData().getURL());
      dataSource.setUser(username);
      dataSource.setPassword(password);
      final Jdbi jdbi = new JdbiConfig().jdbi(dataSource);
      jdbi.useHandle(handle -> {
        assertEquals(person, handle.createQuery("SELECT uuid FROM people WHERE uuid=:uuid")
            .bind("uuid", person).mapTo(String.class).one());
        assertEquals(person, handle.createQuery("SELECT uuid FROM people WHERE uuid IN (<ids>)")
            .bindList("ids", List.of(person)).mapTo(String.class).one());
        assertEquals(person,
            handle.createQuery("SELECT uuid FROM people WHERE uuid::text ILIKE :prefix")
                .bind("prefix", person.substring(0, 8) + "%").mapTo(String.class).one());
        handle
            .createUpdate(
                "UPDATE people SET \"countryUuid\"=:country, \"familyName\"=:name WHERE uuid=:uuid")
            .bind("country", (String) null).bind("name", "Renamed person").bind("uuid", person)
            .execute();
        assertEquals("Renamed person",
            handle.createQuery("SELECT \"familyName\" FROM people WHERE uuid=:uuid")
                .bind("uuid", person).mapTo(String.class).one());
        assertFalse(handle
            .createQuery("SELECT uuid FROM people WHERE \"countryUuid\" IS NULL AND uuid=:uuid")
            .bind("uuid", person).mapTo(String.class).list().isEmpty());
        assertNotNull(
            handle.createQuery("INSERT INTO people (\"familyName\") VALUES (:name) RETURNING uuid")
                .bind("name", "Default UUID").mapTo(String.class).one());
        assertTrue(handle
            .createQuery(
                "SELECT get_core_text('locations', :uuid) @@ to_tsquery('simple', 'migrationland')")
            .bind("uuid", location).mapTo(Boolean.class).one());
        assertTrue(handle.createQuery("SELECT get_core_text('locations', 'invalid') IS NULL")
            .mapTo(Boolean.class).one());
        assertTrue(handle
            .createQuery("SELECT full_text @@ to_tsquery('simple', 'migrationland') "
                + "FROM mv_fts_people WHERE uuid=:uuid")
            .bind("uuid", person).mapTo(Boolean.class).one());
        assertEquals(location,
            handle
                .createQuery("SELECT object_uuid "
                    + "FROM get_cf_referenced_objects('people', 'customFields') WHERE uuid=:uuid")
                .bind("uuid", person).mapTo(String.class).one());
        handle.execute("REFRESH MATERIALIZED VIEW mv_lts_people");
        handle.execute("REFRESH MATERIALIZED VIEW mv_fts_people");
      });
      assertThrows(SQLException.class, () -> execute(connection,
          "UPDATE people SET \"countryUuid\"='00000000-0000-0000-0000-000000000000' WHERE uuid='"
              + person + "'"));
      migrate(connection, resources);
      assertEquals(1, number(connection,
          "SELECT count(*) FROM databasechangelog WHERE id='postgresql-native-uuid'"));
    });
  }

  @Test
  void applicationCrudBatchLoadersAndSearchUseNativeUuids() throws Exception {
    withDatabase(true, connection -> {
      migrate(connection, resources);
      final PGSimpleDataSource dataSource = new PGSimpleDataSource();
      dataSource.setURL(connection.getMetaData().getURL());
      dataSource.setUser(username);
      dataSource.setPassword(password);
      final Jdbi jdbi = new JdbiConfig().jdbi(dataSource);
      final DatabaseHandler handler = new DatabaseHandler(jdbi);
      final LocationDao locations = new LocationDao(handler);
      final Location location = new Location();
      location.setName("Application UUID test");
      location.setStatus(Location.Status.ACTIVE);
      location.setType(Location.LocationType.COUNTRY);
      locations.insert(location);
      assertEquals(location.getUuid(), locations.getByUuid(location.getUuid()).getUuid());
      assertTrue(locations.getByIds(List.of()).isEmpty());
      for (String invalidUuid : List.of("555", "-1", "", "1-1-1-1-1")) {
        final var error =
            assertThrows(ResponseStatusException.class, () -> locations.getByUuid(invalidUuid));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
      }
      final List<Location> mixedIds = locations
          .getByIds(Arrays.asList(location.getUuid(), "00000000-0000-0000-0000-000000000001", null,
              location.getUuid().toUpperCase(Locale.ROOT), location.getUuid()));
      assertEquals(5, mixedIds.size());
      assertEquals(location.getUuid(), mixedIds.get(0).getUuid());
      assertNull(mixedIds.get(1));
      assertNull(mixedIds.get(2));
      assertEquals(location.getUuid(), mixedIds.get(3).getUuid());
      assertEquals(location.getUuid(), mixedIds.get(4).getUuid());
      location.setDescription("Updated through bindBean");
      assertEquals(1, locations.update(location));
      assertEquals(location.getDescription(),
          locations.getByUuid(location.getUuid()).getDescription());

      final LocationSearchQuery prefix = new LocationSearchQuery();
      prefix.setText(location.getUuid().substring(0, 8));
      assertEquals(location.getUuid(), locations.search(prefix).getList().get(0).getUuid());
      final Location childLocation = new Location();
      childLocation.setName("Nested location");
      childLocation.setType(Location.LocationType.COUNTRY);
      childLocation.setStatus(Location.Status.ACTIVE);
      locations.insert(childLocation);
      assertEquals(1, locations.addLocationRelationship(location, childLocation));
      final LocationSearchQuery recursive = new LocationSearchQuery();
      recursive.setLocationUuid(List.of(location.getUuid()));
      recursive.setLocationRecurseStrategy(RecurseStrategy.CHILDREN);
      assertEquals(java.util.Set.of(location.getUuid(), childLocation.getUuid()),
          locations.search(recursive).getList().stream().map(Location::getUuid)
              .collect(java.util.stream.Collectors.toSet()));

      final String sql = "SELECT " + LocationDao.LOCATION_FIELDS
          + ", uuid AS \"foreignUuid\" FROM locations WHERE uuid IN (<ids>)";
      final ForeignKeyBatcher<Location> batcher =
          new ForeignKeyBatcher<>(handler, sql, "ids", new LocationMapper(), "foreignUuid");
      assertTrue(batcher.getByForeignKeys(List.of()).isEmpty());
      assertEquals(location.getUuid(),
          batcher.getByForeignKeys(List.of(location.getUuid())).get(0).get(0).getUuid());
      final ForeignKeyByDateBatcher<Location> datedBatcher = new ForeignKeyByDateBatcher<>(handler,
          sql + " AND \"createdAt\" <= :when", "ids", new LocationMapper(), "foreignUuid");
      assertTrue(datedBatcher.getByForeignKeys(List.of()).isEmpty());
      assertEquals(location.getUuid(),
          datedBatcher
              .getByForeignKeys(List.of(new ImmutablePair<>(location.getUuid(), Instant.now())))
              .get(0).get(0).getUuid());

      final SavedSearchDao savedSearches = new SavedSearchDao(handler);
      final SavedSearch saved = new SavedSearch();
      saved.setName("Native UUID saved search");
      saved.setObjectType(SavedSearch.SearchObjectType.LOCATIONS);
      saved.setQuery("{}");
      saved.setOwnerUuid(jdbi.withHandle(handle -> handle
          .createQuery("SELECT uuid FROM people LIMIT 1").mapTo(String.class).one()));
      savedSearches.insert(saved);
      assertEquals(saved.getOwnerUuid(), savedSearches.getByUuid(saved.getUuid()).getOwnerUuid());
      assertEquals(1, savedSearches.delete(saved.getUuid()));

      final TaskDao tasks = new TaskDao(handler, new AdminDao(handler));
      final Task parent = new Task();
      parent.setShortName("Root UUID task");
      parent.setStatus(Task.Status.ACTIVE);
      tasks.insert(parent);
      final Task child = new Task();
      child.setShortName("Child UUID task");
      child.setStatus(Task.Status.ACTIVE);
      child.setParentTaskUuid(parent.getUuid());
      tasks.insert(child);
      final TaskSearchQuery roots = new TaskSearchQuery();
      roots.setParentTaskUuid(List.of(Task.DUMMY_TASK_UUID));
      assertEquals(List.of(parent.getUuid()),
          tasks.search(roots).getList().stream().map(Task::getUuid).toList());
      final TaskSearchQuery noOrganization = new TaskSearchQuery();
      noOrganization.setTaskedOrgUuid(List.of(Organization.DUMMY_ORG_UUID));
      assertTrue(tasks.search(noOrganization).getList().isEmpty());
      final SearchQueryBatcher<Task, TaskSearchQuery> searchBatcher =
          new SearchQueryBatcher<>(tasks) {};
      assertTrue(searchBatcher.getByForeignKeys(List.of()).isEmpty());
      final TaskSearchQuery children = new TaskSearchQuery();
      children.setBatchParams(new FkBatchParams<>("tasks", "\"parentTaskUuid\""));
      assertEquals(child.getUuid(),
          searchBatcher.getByForeignKeys(List.of(new ImmutablePair<>(parent.getUuid(), children)))
              .get(0).get(0).getUuid());

      final Organization organization = new Organization();
      organization.setUuid(UUID.randomUUID().toString());
      execute(connection,
          "INSERT INTO organizations (uuid) VALUES ('" + organization.getUuid() + "')");
      jdbi.useHandle(handle -> handle.attach(TaskDao.TaskBatch.class)
          .inserttaskTaskedOrganizations(parent.getUuid(), List.of(organization)));
      final TaskSearchQuery assigned = new TaskSearchQuery();
      assigned.setTaskedOrgUuid(List.of(organization.getUuid()));
      assertEquals(parent.getUuid(), tasks.search(assigned).getList().get(0).getUuid());

      execute(connection,
          "INSERT INTO reports (uuid, state) VALUES ('" + UUID.randomUUID() + "', 0)");
      final ReportSearchQuery noGroups = new ReportSearchQuery();
      noGroups.setSystemSearch(true);
      noGroups.setAuthorizationGroupUuid(List.of());
      assertTrue(new PostgresqlReportSearcher(handler).runSearch(null, null, noGroups).join()
          .getList().isEmpty());
      assertEquals(1, locations.removeLocationRelationship(location, childLocation));
      assertEquals(1,
          locations._deleteByUuid(LocationDao.TABLE_NAME, "uuid", childLocation.getUuid()));
      assertEquals(1, locations._deleteByUuid(LocationDao.TABLE_NAME, "uuid", location.getUuid()));
    });
  }

  @Test
  void invalidIdentifiersRollBackWithoutDroppingDependencies() throws Exception {
    withDatabase(true, connection -> {
      execute(connection, "INSERT INTO people (uuid) VALUES ('invalid-uuid')");
      final List<String> foreignKeys = foreignKeys(connection);
      final int viewCount = number(connection, "SELECT count(*) FROM pg_matviews");
      assertThrows(LiquibaseException.class, () -> migrate(connection, resources));
      assertEquals(foreignKeys, foreignKeys(connection));
      assertEquals(viewCount, number(connection, "SELECT count(*) FROM pg_matviews"));
      assertEquals(1, number(connection, "SELECT count(*) FROM people WHERE uuid='invalid-uuid'"));
      assertEquals(0, number(connection, "SELECT count(*) FROM information_schema.columns "
          + "WHERE table_schema='public' AND data_type='uuid'"));
      assertEquals(0, number(connection,
          "SELECT count(*) FROM databasechangelog WHERE id='postgresql-native-uuid'"));
    });
  }

  @Test
  void normalizationCollisionsRollBackSchemaChanges() throws Exception {
    withDatabase(true, connection -> {
      execute(connection, "INSERT INTO people (uuid) VALUES "
          + "('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'), ('AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE')");
      final List<String> foreignKeys = foreignKeys(connection);
      final int viewCount = number(connection, "SELECT count(*) FROM pg_matviews");
      assertThrows(LiquibaseException.class, () -> migrate(connection, resources));
      assertEquals(foreignKeys, foreignKeys(connection));
      assertEquals(viewCount, number(connection, "SELECT count(*) FROM pg_matviews"));
      assertEquals(2, number(connection, "SELECT count(*) FROM people "
          + "WHERE lower(uuid)='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'"));
      assertEquals(0, number(connection, "SELECT count(*) FROM information_schema.columns "
          + "WHERE table_schema='public' AND data_type='uuid'"));
    });
  }

  @Test
  void freshInstallUsesNativeUuidColumns() throws Exception {
    withDatabase(false, connection -> {
      migrate(connection, resources);
      assertNativeColumns(connection);
    });
  }

  private static void assertNativeColumns(Connection connection) throws SQLException {
    assertEquals(0,
        number(connection,
            "SELECT count(*) FROM information_schema.columns "
                + "WHERE table_schema='public' AND data_type IN ('character varying', 'text') "
                + "AND column_name ~* '(^uuid$|uuid(_[ab])?$)'"));
    assertEquals(118, number(connection, "SELECT count(*) FROM information_schema.columns "
        + "WHERE table_schema='public' AND data_type='uuid'"));
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
    try (
        var stream = PostgresqlUuidMigrationTest.class.getClassLoader().getResourceAsStream(name)) {
      assertNotNull(stream, name);
      return new String(stream.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
    }
  }

  private static void migrate(Connection connection, Path directory) throws Exception {
    final boolean autoCommit = connection.getAutoCommit();
    final var database = DatabaseFactory.getInstance()
        .findCorrectDatabaseImplementation(new JdbcConnection(connection));
    try (var accessor = new DirectoryResourceAccessor(directory)) {
      final var liquibase = new Liquibase("db-changelog.yml", accessor, database);
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
    return "anet_uuid_test_" + UUID.randomUUID().toString().replace("-", "");
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

package mil.dds.anet.database;

import static org.jdbi.v3.sqlobject.customizer.BindList.EmptyHandling.NULL_STRING;

import graphql.GraphQLContext;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Tenant;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.database.mappers.TenantMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.ResponseUtils;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.customizer.BindList;
import org.jdbi.v3.sqlobject.statement.SqlBatch;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class TenantDao extends AnetBaseDao<Tenant, AbstractSearchQuery<?>> {
  public static final String[] fields =
      {"uuid", "name", "status", "emailAddresses", "createdAt", "updatedAt"};
  public static final String TABLE_NAME = "tenants";
  public static final String TENANT_FIELDS = DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  private static final String DUPLICATE_TENANT_NAME = "Duplicate tenant name";

  protected TenantDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Override
  public Tenant getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).getFirst();
  }

  class SelfIdBatcher extends IdBatcher<Tenant> {
    private static final String SQL = "/* batch.getTenantsByUuids */ SELECT " + TENANT_FIELDS
        + " FROM " + TABLE_NAME + " WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(TenantDao.this.databaseHandler, SQL, "uuids", new TenantMapper());
    }
  }

  @Override
  public List<Tenant> getByIds(List<String> uuids) {
    return new SelfIdBatcher().getByIds(uuids);
  }

  @Transactional
  public List<Tenant> getAll() {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createQuery(
              "/* getTenants */ SELECT " + TENANT_FIELDS + " FROM " + TABLE_NAME + " ORDER BY name")
          .map(new TenantMapper()).list();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public List<Tenant> getByName(String name) {
    final Handle handle = getDbHandle();
    try {
      return handle.createQuery("/* getTenantsByName */ SELECT " + TENANT_FIELDS + " FROM "
          + TABLE_NAME + " WHERE name = :name").bind("name", name).map(new TenantMapper()).list();
    } finally {
      closeDbHandle(handle);
    }
  }

  public interface TenantBatch {
    @SqlBatch("UPDATE people SET \"tenantUuid\" = :tenantUuid WHERE uuid IN ( <personUuids> )")
    void insertTenantPeople(@Bind("tenantUuid") String tenantUuid,
        @BindList(value = "personUuids", onEmpty = NULL_STRING) List<String> personUuids);

    @SqlUpdate("UPDATE people SET \"tenantUuid\" = :tenantUuid WHERE uuid = :personUuid")
    void updateMemberOfTenant(@Bind("personUuid") String personUuid,
        @Bind("tenantUuid") String tenantUuid);

    @SqlBatch("INSERT INTO \"tenantAdministrativePositions\" (\"tenantUuid\", \"positionUuid\")"
        + " VALUES (:tenantUuid, :uuid)")
    void insertAdministrativePositions(@Bind("tenantUuid") String tenantUuid,
        @BindBean List<Position> positions);

    @SqlUpdate("DELETE FROM \"tenantAdministrativePositions\""
        + " WHERE \"tenantUuid\" = :tenantUuid AND \"positionUuid\" IN ( <positionUuids> )")
    void deleteAdministrativePositions(@Bind("tenantUuid") String tenantUuid,
        @BindList(value = "positionUuids", onEmpty = NULL_STRING) List<String> positionUuids);

    @SqlUpdate("DELETE FROM \"tenantAccessRequests\" "
        + "WHERE \"tenantUuid\" = :tenantUuid AND \"personUuid\" = :personUuid")
    void removeAccessRequestFromTenant(@Bind("personUuid") String personUuid,
        @Bind("tenantUuid") String tenantUuid);
  }

  @Override
  public Tenant insertInternal(Tenant t) {
    final Handle handle = getDbHandle();
    try {
      handle
          .createUpdate("/* insertTenant */ INSERT INTO " + TABLE_NAME
              + " (uuid, name, status, \"emailAddresses\", \"createdAt\", \"updatedAt\")"
              + " VALUES (:uuid, :name, :status, :emailAddresses, :createdAt, :updatedAt)")
          .bindBean(t).bind("status", DaoUtils.getEnumId(t.getStatus()))
          .bind("emailAddresses", Utils.joinEmailAddresses(t.getEmailAddresses()))
          .bind("createdAt", DaoUtils.asLocalDateTime(t.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(t.getUpdatedAt())).execute();
      final TenantBatch tb = handle.attach(TenantBatch.class);
      if (t.getMembers() != null) {
        tb.insertTenantPeople(t.getUuid(), t.getMembers().stream().map(Person::getUuid).toList());
      }
      return t;
    } catch (UnableToExecuteStatementException e) {
      throw ResponseUtils.handleSqlException(e, DUPLICATE_TENANT_NAME);
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public int updateInternal(Tenant t) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* updateTenant */ UPDATE " + TABLE_NAME + " SET name = :name,"
              + " status = :status, \"emailAddresses\" = :emailAddresses,"
              + " \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
          .bindBean(t).bind("status", DaoUtils.getEnumId(t.getStatus()))
          .bind("emailAddresses", Utils.joinEmailAddresses(t.getEmailAddresses()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(t.getUpdatedAt())).execute();
    } catch (UnableToExecuteStatementException e) {
      throw ResponseUtils.handleSqlException(e, DUPLICATE_TENANT_NAME);
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public void addAdministrativePositions(String tenantUuid, List<Position> positions) {
    final Handle handle = getDbHandle();
    try {
      final TenantBatch ab = handle.attach(TenantBatch.class);
      if (positions != null) {
        ab.insertAdministrativePositions(tenantUuid, positions);
      }
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public void removeAdministrativePositions(String tenantUuid, List<String> positionUuids) {
    final Handle handle = getDbHandle();
    try {
      final TenantBatch ab = handle.attach(TenantBatch.class);
      if (positionUuids != null) {
        ab.deleteAdministrativePositions(tenantUuid, positionUuids);
      }
    } finally {
      closeDbHandle(handle);
    }
  }

  public CompletableFuture<List<Tenant>> getTenantAccessRequestsForPerson(GraphQLContext context,
      String personUuid) {
    return new ForeignKeyFetcher<Tenant>().load(context,
        FkDataLoaderKey.TENANT_ACCESS_REQUESTS_FOR_PERSON, personUuid);
  }

  class TenantAccessRequestsForPersonBatcher extends ForeignKeyBatcher<Tenant> {
    private static final String SQL =
        "/* batch.getTenantAccessRequestsForPerson */ SELECT \"tenantAccessRequests\".\"personUuid\", "
            + TENANT_FIELDS + " FROM \"tenantAccessRequests\" INNER JOIN " + TABLE_NAME
            + " ON tenants.uuid = \"tenantAccessRequests\".\"tenantUuid\""
            + " WHERE \"tenantAccessRequests\".\"personUuid\" IN ( <foreignKeys> )"
            + " ORDER BY tenants.name";

    public TenantAccessRequestsForPersonBatcher() {
      super(TenantDao.this.databaseHandler, SQL, "foreignKeys", new TenantMapper(), "personUuid");
    }
  }

  public List<List<Tenant>> getTenantAccessRequestsForPerson(List<String> foreignKeys) {
    return new TenantAccessRequestsForPersonBatcher().getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<Tenant>> getTenantsForReport(GraphQLContext context,
      String reportUuid) {
    return new ForeignKeyFetcher<Tenant>().load(context, FkDataLoaderKey.TENANT_REPORT, reportUuid);
  }

  class TenantsForReportBatcher extends ForeignKeyBatcher<Tenant> {
    private static final String SQL =
        "/* batch.getTenantsForReport */ SELECT \"reportTenants\".\"reportUuid\", " + TENANT_FIELDS
            + " FROM \"reportTenants\" INNER JOIN " + TABLE_NAME
            + " ON tenants.uuid = \"reportTenants\".\"tenantUuid\" "
            + " WHERE \"reportTenants\".\"reportUuid\" IN ( <foreignKeys> )"
            + " ORDER BY tenants.name";

    public TenantsForReportBatcher() {
      super(TenantDao.this.databaseHandler, SQL, "foreignKeys", new TenantMapper(), "reportUuid");
    }
  }

  public List<List<Tenant>> getTenantsForReport(List<String> foreignKeys) {
    return new TenantsForReportBatcher().getByForeignKeys(foreignKeys);
  }

  class AccessRequestsBatcher extends ForeignKeyBatcher<Person> {
    private static final String SQL =
        "/* batch.getAccessRequestsForTenant */ SELECT \"tenantAccessRequests\".\"tenantUuid\", "
            + PersonDao.PERSON_FIELDS + " FROM \"tenantAccessRequests\" "
            + "INNER JOIN people ON people.uuid = \"tenantAccessRequests\".\"personUuid\" "
            + "WHERE \"tenantAccessRequests\".\"tenantUuid\" IN ( <foreignKeys> ) "
            + "ORDER BY people.\"familyName\", people.\"givenName\", people.uuid";

    public AccessRequestsBatcher() {
      super(TenantDao.this.databaseHandler, SQL, "foreignKeys", new PersonMapper(), "tenantUuid");
    }
  }

  public List<List<Person>> getAccessRequests(List<String> foreignKeys) {
    return new AccessRequestsBatcher().getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<Person>> getAccessRequestsForTenant(GraphQLContext context,
      String tenantUuid) {
    return new ForeignKeyFetcher<Person>().load(context,
        FkDataLoaderKey.TENANT_ACCESS_REQUESTS_FOR_TENANT, tenantUuid);
  }

  @Transactional
  public void removeAccessRequestFromTenant(Person p, Tenant t) {
    final Handle handle = getDbHandle();
    try {
      final TenantBatch tb = handle.attach(TenantBatch.class);
      tb.removeAccessRequestFromTenant(p.getUuid(), t.getUuid());
    } finally {
      closeDbHandle(handle);
    }
  }

  class MembersBatcher extends ForeignKeyBatcher<Person> {
    private static final String SQL =
        "/* batch.getMembersForTenant */ SELECT " + PersonDao.PERSON_FIELDS + " FROM people "
            + "WHERE people.\"tenantUuid\" IN ( <foreignKeys> ) "
            + "ORDER BY people.\"familyName\", people.\"givenName\", people.uuid";

    public MembersBatcher() {
      super(TenantDao.this.databaseHandler, SQL, "foreignKeys", new PersonMapper(),
          "people_tenantUuid");
    }
  }

  public List<List<Person>> getMembers(List<String> foreignKeys) {
    return new MembersBatcher().getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<Person>> getMembersForTenant(GraphQLContext context,
      String tenantUuid) {
    return new ForeignKeyFetcher<Person>().load(context, FkDataLoaderKey.TENANT_MEMBERS,
        tenantUuid);
  }

  @Transactional
  public void addMemberToTenant(Person p, Tenant t) {
    final Handle handle = getDbHandle();
    try {
      final TenantBatch tb = handle.attach(TenantBatch.class);
      tb.updateMemberOfTenant(p.getUuid(), t.getUuid());
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public void removeMemberFromTenant(Person p, Tenant t) {
    final Handle handle = getDbHandle();
    try {
      final TenantBatch tb = handle.attach(TenantBatch.class);
      tb.updateMemberOfTenant(p.getUuid(), null);
    } finally {
      closeDbHandle(handle);
    }
  }

  class TenantAdministrativePositionsBatcher extends ForeignKeyBatcher<Position> {
    private static final String SQL = "/* batch.getTenantAdministrativePositions */"
        + " SELECT \"tenantAdministrativePositions\".\"tenantUuid\"," + PositionDao.POSITION_FIELDS
        + " FROM \"tenantAdministrativePositions\""
        + " INNER JOIN positions on positions.uuid = \"tenantAdministrativePositions\".\"positionUuid\""
        + " WHERE \"tenantAdministrativePositions\".\"tenantUuid\" IN ( <foreignKeys> )"
        + " ORDER BY positions.name, positions.uuid";

    public TenantAdministrativePositionsBatcher() {
      super(TenantDao.this.databaseHandler, SQL, "foreignKeys", new PositionMapper(), "tenantUuid");
    }
  }

  public List<List<Position>> getAdministrativePositions(List<String> foreignKeys) {
    return new TenantAdministrativePositionsBatcher().getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<Position>> getAdministrativePositionsForTenant(
      GraphQLContext context, String tenantUuid) {
    return new ForeignKeyFetcher<Position>().load(context,
        FkDataLoaderKey.TENANT_ADMINISTRATIVE_POSITIONS, tenantUuid);
  }

  @Transactional
  public List<Tenant> getTenantsAdministratedByPosition(String positionUuid) {
    final Handle handle = getDbHandle();
    try {
      final String sql = "/* getTenantsAdministratedByPosition */ SELECT " + TENANT_FIELDS
          + " FROM " + TABLE_NAME + " JOIN \"tenantAdministrativePositions\" tap"
          + " ON tap.\"tenantUuid\" = tenants.uuid WHERE tap.\"positionUuid\" = :positionUuid"
          + " ORDER BY tenants.name";
      return handle.createQuery(sql).bind("positionUuid", positionUuid).map(new TenantMapper())
          .list();
    } finally {
      closeDbHandle(handle);
    }
  }
}

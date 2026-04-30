package mil.dds.anet.database;

import graphql.GraphQLContext;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Tenant;
import mil.dds.anet.beans.search.AbstractSearchQuery;
import mil.dds.anet.database.mappers.PersonMapper;
import mil.dds.anet.database.mappers.TenantMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.ResponseUtils;
import mil.dds.anet.views.ForeignKeyFetcher;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.statement.SqlBatch;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class TenantDao extends AnetBaseDao<Tenant, AbstractSearchQuery<?>> {
  public static final String TABLE_NAME = "tenants";

  private static final String DUPLICATE_TENANT_NAME = "Duplicate tenant name";

  protected TenantDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Override
  public Tenant getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).getFirst();
  }

  class SelfIdBatcher extends IdBatcher<Tenant> {
    private static final String SQL =
        "/* batch.getTenantsByUuids */ SELECT * from " + TABLE_NAME + " where uuid IN ( <uuids> )";

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
      return handle.createQuery("/* getTenants */ SELECT * FROM " + TABLE_NAME + " ORDER BY name")
          .map(new TenantMapper()).list();
    } finally {
      closeDbHandle(handle);
    }
  }

  public interface TenantBatch {
    @SqlBatch("INSERT INTO \"peopleTenants\" (\"tenantUuid\", \"personUuid\") VALUES (:tenantUuid, :uuid)")
    void insertTenantPeople(@Bind("tenantUuid") String tenantUuid, @BindBean List<Person> people);
  }

  @Override
  public Tenant insertInternal(Tenant t) {
    final Handle handle = getDbHandle();
    try {
      handle
          .createUpdate("/* insertTenant */ INSERT INTO " + TABLE_NAME
              + " (uuid, name, status, \"createdAt\", \"updatedAt\")"
              + " VALUES (:uuid, :name, :status, :createdAt, :updatedAt)")
          .bindBean(t).bind("status", DaoUtils.getEnumId(t.getStatus()))
          .bind("createdAt", DaoUtils.asLocalDateTime(t.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(t.getUpdatedAt())).execute();
      final TenantBatch tb = handle.attach(TenantBatch.class);
      if (t.getMembers() != null) {
        tb.insertTenantPeople(t.getUuid(), t.getMembers());
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
              + " status = :status, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
          .bindBean(t).bind("status", DaoUtils.getEnumId(t.getStatus()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(t.getUpdatedAt())).execute();
    } catch (UnableToExecuteStatementException e) {
      throw ResponseUtils.handleSqlException(e, DUPLICATE_TENANT_NAME);
    } finally {
      closeDbHandle(handle);
    }
  }

  public CompletableFuture<List<Tenant>> getTenantsForPerson(GraphQLContext context,
      String personUuid) {
    return new ForeignKeyFetcher<Tenant>().load(context, FkDataLoaderKey.TENANT_PERSON, personUuid);
  }

  class TenantsForPersonBatcher extends ForeignKeyBatcher<Tenant> {
    private static final String SQL =
        "/* batch.getTenantsForPerson */ SELECT \"peopleTenants\".\"personUuid\", " + TABLE_NAME
            + ".*  FROM \"peopleTenants\" INNER JOIN " + TABLE_NAME
            + " ON tenants.uuid = \"peopleTenants\".\"tenantUuid\" "
            + "WHERE \"peopleTenants\".\"personUuid\" IN ( <foreignKeys> ) ";

    public TenantsForPersonBatcher() {
      super(TenantDao.this.databaseHandler, SQL, "foreignKeys", new TenantMapper(), "personUuid");
    }
  }

  public List<List<Tenant>> getTenantsForPerson(List<String> foreignKeys) {
    return new TenantsForPersonBatcher().getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<Tenant>> getTenantsForReport(GraphQLContext context,
      String reportUuid) {
    return new ForeignKeyFetcher<Tenant>().load(context, FkDataLoaderKey.TENANT_REPORT, reportUuid);
  }

  class TenantsForReportBatcher extends ForeignKeyBatcher<Tenant> {
    private static final String SQL =
        "/* batch.getTenantsForReport */ SELECT \"reportTenants\".\"reportUuid\", " + TABLE_NAME
            + ".*  FROM \"reportTenants\" INNER JOIN " + TABLE_NAME
            + " ON tenants.uuid = \"reportTenants\".\"tenantUuid\" "
            + "WHERE \"reportTenants\".\"reportUuid\" IN ( <foreignKeys> ) ";

    public TenantsForReportBatcher() {
      super(TenantDao.this.databaseHandler, SQL, "foreignKeys", new TenantMapper(), "reportUuid");
    }
  }

  public List<List<Tenant>> getTenantsForReport(List<String> foreignKeys) {
    return new TenantsForReportBatcher().getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<Tenant>> getTenantsForAccessToken(GraphQLContext context,
      String accessTokenUuid) {
    return new ForeignKeyFetcher<Tenant>().load(context, FkDataLoaderKey.TENANT_ACCESS_TOKEN,
        accessTokenUuid);
  }

  class TenantsForAccessTokenBatcher extends ForeignKeyBatcher<Tenant> {
    private static final String SQL =
        "/* batch.getTenantsForAccessToken */ SELECT \"accessTokenTenants\".\"accessTokenUuid\", "
            + TABLE_NAME + ".*  FROM \"accessTokenTenants\" INNER JOIN " + TABLE_NAME
            + " ON tenants.uuid = \"accessTokenTenants\".\"tenantUuid\" "
            + "WHERE \"accessTokenTenants\".\"accessTokenUuid\" IN ( <foreignKeys> ) ";

    public TenantsForAccessTokenBatcher() {
      super(TenantDao.this.databaseHandler, SQL, "foreignKeys", new TenantMapper(),
          "accessTokenUuid");
    }
  }

  public List<List<Tenant>> getTenantsForAccessToken(List<String> foreignKeys) {
    return new TenantsForAccessTokenBatcher().getByForeignKeys(foreignKeys);
  }

  class MembersBatcher extends ForeignKeyBatcher<Person> {
    private static final String SQL =
        "/* batch.getMembersForTenant */ SELECT \"peopleTenants\".\"tenantUuid\", "
            + PersonDao.PERSON_FIELDS + " FROM \"peopleTenants\" "
            + "INNER JOIN people ON people.uuid = \"peopleTenants\".\"personUuid\" "
            + "WHERE \"peopleTenants\".\"tenantUuid\" IN ( <foreignKeys> ) "
            + "ORDER BY people.\"familyName\", people.\"givenName\", people.uuid";

    public MembersBatcher() {
      super(TenantDao.this.databaseHandler, SQL, "foreignKeys", new PersonMapper(), "tenantUuid");
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
  public int addMemberToTenant(Person p, Tenant t) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate(
          "/* addMemberToTenant */ INSERT INTO \"peopleTenants\" (\"personUuid\", \"tenantUuid\") "
              + "VALUES (:personUuid, :tenantUuid)")
          .bind("tenantUuid", t.getUuid()).bind("personUuid", p.getUuid()).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int removeMemberFromTenant(String personUuid, Tenant t) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* removeMemberFromTenant*/ DELETE FROM \"peopleTenants\" "
              + "WHERE \"tenantUuid\" = :tenantUuid AND \"personUuid\" = :personUuid")
          .bind("tenantUuid", t.getUuid()).bind("personUuid", personUuid).execute();
    } finally {
      closeDbHandle(handle);
    }
  }
}

package mil.dds.anet.database;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationStatus;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.database.mappers.OrganizationMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.SqDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.ForeignKeyFetcher;
import mil.dds.anet.views.SearchQueryFetcher;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.jdbi.v3.sqlobject.config.RegisterRowMapper;
import org.jdbi.v3.sqlobject.customizer.BindList;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class OrganizationDao
    extends AnetSubscribableObjectDao<Organization, OrganizationSearchQuery> {

  private static String[] fields = {"uuid", "shortName", "longName", "status", "identificationCode",
      "type", "createdAt", "updatedAt", "parentOrgUuid"};
  public static String TABLE_NAME = "organizations";
  public static String ORGANIZATION_FIELDS = DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  @Override
  public Organization getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<Organization> {
    private static final String sql = "/* batch.getOrgsByUuids */ SELECT " + ORGANIZATION_FIELDS
        + " from organizations where uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(sql, "uuids", new OrganizationMapper());
    }
  }

  @Override
  public List<Organization> getByIds(List<String> uuids) {
    final IdBatcher<Organization> idBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
    return idBatcher.getByIds(uuids);
  }

  static class OrganizationsBatcher extends ForeignKeyBatcher<Organization> {
    private static final String sql =
        "/* batch.getOrganizationForPerson */ SELECT positions.\"currentPersonUuid\" AS \"personUuid\", "
            + ORGANIZATION_FIELDS + "FROM organizations, positions WHERE "
            + "positions.\"currentPersonUuid\" IN ( <foreignKeys> ) AND positions.\"organizationUuid\" = organizations.uuid";

    public OrganizationsBatcher() {
      super(sql, "foreignKeys", new OrganizationMapper(), "personUuid");
    }
  }

  public List<List<Organization>> getOrganizations(List<String> foreignKeys) {
    final ForeignKeyBatcher<Organization> personIdBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(OrganizationsBatcher.class);
    return personIdBatcher.getByForeignKeys(foreignKeys);
  }

  static class OrganizationSearchBatcher
      extends SearchQueryBatcher<Organization, OrganizationSearchQuery> {
    public OrganizationSearchBatcher() {
      super(AnetObjectEngine.getInstance().getOrganizationDao());
    }
  }

  public List<List<Organization>> getOrganizationsBySearch(
      List<ImmutablePair<String, OrganizationSearchQuery>> foreignKeys) {
    final OrganizationSearchBatcher instance =
        AnetObjectEngine.getInstance().getInjector().getInstance(OrganizationSearchBatcher.class);
    return instance.getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<Organization>> getOrganizationsBySearch(Map<String, Object> context,
      String uuid, OrganizationSearchQuery query) {
    return new SearchQueryFetcher<Organization, OrganizationSearchQuery>().load(context,
        SqDataLoaderKey.ORGANIZATIONS_SEARCH, new ImmutablePair<>(uuid, query));
  }

  public CompletableFuture<List<Organization>> getOrganizationsForPerson(
      Map<String, Object> context, String personUuid) {
    return new ForeignKeyFetcher<Organization>().load(context, FkDataLoaderKey.PERSON_ORGANIZATIONS,
        personUuid);
  }

  @InTransaction
  public List<Organization> getTopLevelOrgs(OrganizationType type) {
    return getDbHandle()
        .createQuery("/* getTopLevelOrgs */ SELECT " + ORGANIZATION_FIELDS + " FROM organizations "
            + "WHERE \"parentOrgUuid\" IS NULL AND status = :status AND type = :type")
        .bind("status", DaoUtils.getEnumId(OrganizationStatus.ACTIVE))
        .bind("type", DaoUtils.getEnumId(type)).map(new OrganizationMapper()).list();
  }

  public interface OrgListQueries {
    @RegisterRowMapper(OrganizationMapper.class)
    @SqlQuery("SELECT uuid AS organizations_uuid, uuid AS uuid"
        + ", \"shortName\" AS \"organizations_shortName\""
        + ", \"longName\" AS \"organizations_longName\", status AS organizations_status"
        + ", \"identificationCode\" AS \"organizations_identificationCode\""
        + ", type AS organizations_type, \"parentOrgUuid\" AS \"organizations_parentOrgUuid\""
        + ", \"createdAt\" AS \"organizations_createdAt\""
        + ", \"updatedAt\" AS \"organizations_updatedAt\""
        + " FROM organizations WHERE \"shortName\" IN ( <shortNames> )")
    public List<Organization> getOrgsByShortNames(@BindList("shortNames") List<String> shortNames);
  }

  @InTransaction
  public List<Organization> getOrgsByShortNames(List<String> shortNames) {
    if (Utils.isEmptyOrNull(shortNames)) {
      return Collections.emptyList();
    }
    return getDbHandle().attach(OrgListQueries.class).getOrgsByShortNames(shortNames);
  }

  @Override
  public Organization insertInternal(Organization org) {
    getDbHandle().createUpdate(
        "/* insertOrg */ INSERT INTO organizations (uuid, \"shortName\", \"longName\", status, \"identificationCode\", type, \"createdAt\", \"updatedAt\", \"parentOrgUuid\") "
            + "VALUES (:uuid, :shortName, :longName, :status, :identificationCode, :type, :createdAt, :updatedAt, :parentOrgUuid)")
        .bindBean(org).bind("createdAt", DaoUtils.asLocalDateTime(org.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(org.getUpdatedAt()))
        .bind("status", DaoUtils.getEnumId(org.getStatus()))
        .bind("type", DaoUtils.getEnumId(org.getType()))
        .bind("parentOrgUuid", DaoUtils.getUuid(org.getParentOrg())).execute();
    return org;
  }

  @Override
  public int updateInternal(Organization org) {
    return getDbHandle().createUpdate("/* updateOrg */ UPDATE organizations "
        + "SET \"shortName\" = :shortName, \"longName\" = :longName, status = :status, \"identificationCode\" = :identificationCode, type = :type, "
        + "\"updatedAt\" = :updatedAt, \"parentOrgUuid\" = :parentOrgUuid where uuid = :uuid")
        .bindBean(org).bind("updatedAt", DaoUtils.asLocalDateTime(org.getUpdatedAt()))
        .bind("status", DaoUtils.getEnumId(org.getStatus()))
        .bind("type", DaoUtils.getEnumId(org.getType()))
        .bind("parentOrgUuid", DaoUtils.getUuid(org.getParentOrg())).execute();
  }

  @Override
  public AnetBeanList<Organization> search(OrganizationSearchQuery query) {
    return AnetObjectEngine.getInstance().getSearcher().getOrganizationSearcher().runSearch(query);
  }

  @Override
  public SubscriptionUpdateGroup getSubscriptionUpdate(Organization obj) {
    return getCommonSubscriptionUpdate(obj, TABLE_NAME, "organizations.uuid");
  }
}

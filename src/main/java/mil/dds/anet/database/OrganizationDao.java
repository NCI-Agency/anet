package mil.dds.anet.database;

import static org.jdbi.v3.sqlobject.customizer.BindList.EmptyHandling.NULL_STRING;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.database.mappers.OrganizationMapper;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.SqDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.ForeignKeyFetcher;
import mil.dds.anet.views.SearchQueryFetcher;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.jdbi.v3.sqlobject.config.RegisterRowMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.customizer.BindList;
import org.jdbi.v3.sqlobject.statement.SqlBatch;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class OrganizationDao
    extends AnetSubscribableObjectDao<Organization, OrganizationSearchQuery> {

  private static final String[] fields =
      {"uuid", "shortName", "longName", "status", "identificationCode", "profile", "app6context",
          "app6standardIdentity", "app6symbolSet", "app6hq", "app6amplifier", "createdAt",
          "updatedAt", "parentOrgUuid", "locationUuid", "customFields"};
  public static final String TABLE_NAME = "organizations";
  public static final String ORGANIZATION_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

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

  static class AdministratingPositionsBatcher extends ForeignKeyBatcher<Position> {
    private static final String sql =
        "/* batch.getAdministratingPositionsForOrganization */ SELECT \"organizationAdministrativePositions\".\"organizationUuid\", "
            + PositionDao.POSITION_FIELDS + " FROM \"organizationAdministrativePositions\" "
            + "INNER JOIN positions on positions.uuid = \"organizationAdministrativePositions\".\"positionUuid\" "
            + "WHERE \"organizationAdministrativePositions\".\"organizationUuid\" IN ( <foreignKeys> ) ";

    public AdministratingPositionsBatcher() {
      super(sql, "foreignKeys", new PositionMapper(), "organizationUuid");
    }
  }

  public List<List<Position>> getAdministratingPositions(List<String> foreignKeys) {
    final ForeignKeyBatcher<Position> administratingPositionsBatcher = AnetObjectEngine
        .getInstance().getInjector().getInstance(AdministratingPositionsBatcher.class);
    return administratingPositionsBatcher.getByForeignKeys(foreignKeys);
  }

  public interface OrgListQueries {
    @RegisterRowMapper(OrganizationMapper.class)
    @SqlQuery("SELECT uuid AS organizations_uuid, uuid AS uuid"
        + ", \"shortName\" AS \"organizations_shortName\""
        + ", \"longName\" AS \"organizations_longName\", status AS organizations_status"
        + ", \"identificationCode\" AS \"organizations_identificationCode\""
        + ", \"parentOrgUuid\" AS \"organizations_parentOrgUuid\""
        + ", \"createdAt\" AS \"organizations_createdAt\""
        + ", \"updatedAt\" AS \"organizations_updatedAt\""
        + ", \"locationUuid\" AS \"organizations_locationUuid\""
        + " FROM organizations WHERE \"shortName\" IN ( <shortNames> )")
    public List<Organization> getOrgsByShortNames(
        @BindList(value = "shortNames", onEmpty = NULL_STRING) List<String> shortNames);
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
    getDbHandle()
        .createUpdate(
            "/* insertOrg */ INSERT INTO organizations (uuid, \"shortName\", \"longName\", status, "
                + "\"identificationCode\", profile, app6context, \"app6standardIdentity\", "
                + "\"app6symbolSet\", app6hq, app6amplifier, \"createdAt\", \"updatedAt\", "
                + "\"parentOrgUuid\", \"locationUuid\", \"customFields\") "
                + "VALUES (:uuid, :shortName, :longName, :status, :identificationCode, :profile, "
                + ":app6context, :app6standardIdentity, :app6symbolSet, :app6hq, :app6amplifier, "
                + ":createdAt, :updatedAt, :parentOrgUuid, :locationUuid, :customFields)")
        .bindBean(org).bind("createdAt", DaoUtils.asLocalDateTime(org.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(org.getUpdatedAt()))
        .bind("status", DaoUtils.getEnumId(org.getStatus()))
        .bind("parentOrgUuid", DaoUtils.getUuid(org.getParentOrg()))
        .bind("locationUuid", DaoUtils.getUuid(org.getLocation())).execute();
    final OrganizationBatch ob = getDbHandle().attach(OrganizationBatch.class);
    if (org.getAdministratingPositions() != null) {
      ob.insertOrganizationAdministratingPositions(org.getUuid(), org.getAdministratingPositions());
    }
    return org;
  }

  public interface OrganizationBatch {
    @SqlBatch("INSERT INTO \"organizationAdministrativePositions\" (\"organizationUuid\", \"positionUuid\") VALUES (:organizationUuid, :uuid)")
    void insertOrganizationAdministratingPositions(
        @Bind("organizationUuid") String organizationUuid,
        @BindBean List<Position> administratingPositions);
  }

  @Override
  public int updateInternal(Organization org) {
    return getDbHandle().createUpdate("/* updateOrg */ UPDATE organizations "
        + "SET \"shortName\" = :shortName, \"longName\" = :longName, status = :status, "
        + "\"identificationCode\" = :identificationCode, profile = :profile, "
        + "app6context = :app6context, \"app6standardIdentity\" = :app6standardIdentity, "
        + "\"app6symbolSet\" = :app6symbolSet, app6hq = :app6hq, app6amplifier = :app6amplifier, "
        + "\"updatedAt\" = :updatedAt, \"parentOrgUuid\" = :parentOrgUuid, "
        + "\"locationUuid\" = :locationUuid, \"customFields\" = :customFields WHERE uuid = :uuid")
        .bindBean(org).bind("updatedAt", DaoUtils.asLocalDateTime(org.getUpdatedAt()))
        .bind("status", DaoUtils.getEnumId(org.getStatus()))
        .bind("parentOrgUuid", DaoUtils.getUuid(org.getParentOrg()))
        .bind("locationUuid", DaoUtils.getUuid(org.getLocation())).execute();
  }

  @InTransaction
  public int addPositionToOrganization(Position p, Organization o) {
    return getDbHandle().createUpdate(
        "/* addPositionToOrganization */ INSERT INTO \"organizationAdministrativePositions\" (\"organizationUuid\", \"positionUuid\") "
            + "VALUES (:organizationUuid, :positionUuid)")
        .bind("organizationUuid", o.getUuid()).bind("positionUuid", p.getUuid()).execute();
  }

  @InTransaction
  public int removePositionFromOrganization(String positionUuid, Organization o) {
    return getDbHandle().createUpdate(
        "/* removePositionFromOrganization*/ DELETE FROM \"organizationAdministrativePositions\" "
            + "WHERE \"organizationUuid\" = :organizationUuid AND \"positionUuid\" = :positionUuid")
        .bind("organizationUuid", o.getUuid()).bind("positionUuid", positionUuid).execute();
  }

  public CompletableFuture<List<Position>> getAdministratingPositionsForOrganization(
      Map<String, Object> context, String organizationUuid) {
    return new ForeignKeyFetcher<Position>().load(context,
        FkDataLoaderKey.ORGANIZATION_ADMINISTRATIVE_POSITIONS, organizationUuid);
  }

  @Override
  public AnetBeanList<Organization> search(OrganizationSearchQuery query) {
    return AnetObjectEngine.getInstance().getSearcher().getOrganizationSearcher().runSearch(query);
  }

  @Override
  public SubscriptionUpdateGroup getSubscriptionUpdate(Organization obj) {
    return getCommonSubscriptionUpdate(obj, TABLE_NAME, "organizations.uuid");
  }

  @InTransaction
  public int mergeOrganizations(final Organization loserOrganization,
      final Organization winnerOrganization) {
    final var loserOrganizationUuid = loserOrganization.getUuid();
    final var winnerOrganizationUuid = winnerOrganization.getUuid();
    final var existingLoserOrg = getByUuid(loserOrganizationUuid);
    final var existingWinnerOrg = getByUuid(winnerOrganizationUuid);
    final var context = AnetObjectEngine.getInstance().getContext();

    update(winnerOrganization);

    // Update approvalSteps (note that this may fail if reports are currently pending at one of the
    // approvalSteps that are going to be deleted):
    // - delete approvalSteps of loser
    final List<ApprovalStep> existingLoserPlanningApprovalSteps =
        existingLoserOrg.loadPlanningApprovalSteps(context).join();
    final List<ApprovalStep> existingLoserApprovalSteps =
        existingLoserOrg.loadApprovalSteps(context).join();
    Utils.updateApprovalSteps(loserOrganization, List.of(), existingLoserPlanningApprovalSteps,
        List.of(), existingLoserApprovalSteps);
    // - update approvalSteps of winner
    final List<ApprovalStep> existingWinnerPlanningApprovalSteps =
        existingWinnerOrg.loadPlanningApprovalSteps(context).join();
    final List<ApprovalStep> existingWinnerApprovalSteps =
        existingWinnerOrg.loadApprovalSteps(context).join();
    Utils.updateApprovalSteps(winnerOrganization, winnerOrganization.getPlanningApprovalSteps(),
        existingWinnerPlanningApprovalSteps, winnerOrganization.getApprovalSteps(),
        existingWinnerApprovalSteps);

    // Assign tasks to the winner
    updateForMerge("taskTaskedOrganizations", "organizationUuid", winnerOrganizationUuid,
        loserOrganizationUuid);
    // Move positions to the winner
    updateForMerge(PositionDao.TABLE_NAME, "organizationUuid", winnerOrganizationUuid,
        loserOrganizationUuid);
    // Move authorizationGroups to the winner
    updateForMerge("authorizationGroupRelatedObjects", "relatedObjectUuid", winnerOrganizationUuid,
        loserOrganizationUuid);

    // Update organizationAdministrativePositions
    deleteForMerge("organizationAdministrativePositions", "organizationUuid",
        loserOrganizationUuid);
    Utils.addRemoveElementsByUuid(existingWinnerOrg.loadAdministratingPositions(context).join(),
        Utils.orIfNull(winnerOrganization.getAdministratingPositions(), new ArrayList<>()),
        newPos -> addPositionToOrganization(newPos, winnerOrganization),
        oldPos -> removePositionFromOrganization(DaoUtils.getUuid(oldPos), winnerOrganization));

    // Update emailAddresses
    final EmailAddressDao emailAddressDao = AnetObjectEngine.getInstance().getEmailAddressDao();
    emailAddressDao.updateEmailAddresses(OrganizationDao.TABLE_NAME, loserOrganizationUuid, null);
    emailAddressDao.updateEmailAddresses(OrganizationDao.TABLE_NAME, winnerOrganizationUuid,
        winnerOrganization.getEmailAddresses());

    return deleteForMerge(OrganizationDao.TABLE_NAME, "uuid", loserOrganizationUuid);
  }
}

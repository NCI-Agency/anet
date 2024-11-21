package mil.dds.anet.database;

import static org.jdbi.v3.sqlobject.customizer.BindList.EmptyHandling.NULL_STRING;

import graphql.GraphQLContext;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.EntityAvatar;
import mil.dds.anet.beans.MergedEntity;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.database.mappers.OrganizationMapper;
import mil.dds.anet.database.mappers.PositionMapper;
import mil.dds.anet.search.pg.PostgresqlOrganizationSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.utils.SqDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.ForeignKeyByDateFetcher;
import mil.dds.anet.views.ForeignKeyFetcher;
import mil.dds.anet.views.SearchQueryFetcher;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.jdbi.v3.core.Handle;
import org.jdbi.v3.sqlobject.config.RegisterRowMapper;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.customizer.BindList;
import org.jdbi.v3.sqlobject.statement.SqlBatch;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class OrganizationDao
    extends AnetSubscribableObjectDao<Organization, OrganizationSearchQuery> {

  private static final String[] fields =
      {"uuid", "shortName", "longName", "status", "identificationCode", "profile", "app6context",
          "app6standardIdentity", "app6symbolSet", "app6hq", "app6amplifier", "createdAt",
          "updatedAt", "parentOrgUuid", "locationUuid", "customFields"};
  public static final String TABLE_NAME = "organizations";
  public static final String ORGANIZATION_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  private final AdminDao adminDao;
  private final EmailAddressDao emailAddressDao;

  public OrganizationDao(DatabaseHandler databaseHandler, AdminDao adminDao,
      EmailAddressDao emailAddressDao) {
    super(databaseHandler);
    this.adminDao = adminDao;
    this.emailAddressDao = emailAddressDao;
  }

  @Override
  public Organization getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  class SelfIdBatcher extends IdBatcher<Organization> {
    private static final String SQL = "/* batch.getOrgsByUuids */ SELECT " + ORGANIZATION_FIELDS
        + " from organizations where uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(OrganizationDao.this.databaseHandler, SQL, "uuids", new OrganizationMapper());
    }
  }

  @Override
  public List<Organization> getByIds(List<String> uuids) {
    return new SelfIdBatcher().getByIds(uuids);
  }

  class OrganizationsBatcher extends ForeignKeyBatcher<Organization> {
    private static final String SQL =
        "/* batch.getOrganizationForPerson */ SELECT positions.\"currentPersonUuid\" AS \"personUuid\", "
            + ORGANIZATION_FIELDS + "FROM organizations, positions WHERE "
            + "positions.\"currentPersonUuid\" IN ( <foreignKeys> ) AND positions.\"organizationUuid\" = organizations.uuid";

    public OrganizationsBatcher() {
      super(OrganizationDao.this.databaseHandler, SQL, "foreignKeys", new OrganizationMapper(),
          "personUuid");
    }
  }

  public List<List<Organization>> getOrganizations(List<String> foreignKeys) {
    return new OrganizationsBatcher().getByForeignKeys(foreignKeys);
  }

  class OrganizationsByDateBatcher extends ForeignKeyByDateBatcher<Organization> {
    private static final String sql =
        "/* batch.getOrganizationForPerson */ SELECT \"peoplePositions\".\"personUuid\" AS \"personUuid\", "
            + ORGANIZATION_FIELDS + " FROM organizations, \"peoplePositions\", positions "
            + "WHERE \"peoplePositions\".\"personUuid\" IN ( <foreignKeys> ) "
            + "AND \"peoplePositions\".\"positionUuid\" = positions.uuid "
            + "AND positions.\"organizationUuid\" = organizations.uuid "
            + "AND \"peoplePositions\".\"createdAt\" <= :when "
            + "AND (\"peoplePositions\".\"endedAt\" IS NULL"
            + " OR \"peoplePositions\".\"endedAt\" > :when)";

    public OrganizationsByDateBatcher() {
      super(OrganizationDao.this.databaseHandler, sql, "foreignKeys", new OrganizationMapper(),
          "personUuid");
    }
  }

  public List<List<Organization>> getOrganizationsByDate(
      List<ImmutablePair<String, Instant>> foreignKeys) {
    return new OrganizationsByDateBatcher().getByForeignKeys(foreignKeys);
  }

  class OrganizationSearchBatcher
      extends SearchQueryBatcher<Organization, OrganizationSearchQuery> {
    public OrganizationSearchBatcher() {
      super(OrganizationDao.this);
    }
  }

  public List<List<Organization>> getOrganizationsBySearch(
      List<ImmutablePair<String, OrganizationSearchQuery>> foreignKeys) {
    return new OrganizationSearchBatcher().getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<Organization>> getOrganizationsBySearch(GraphQLContext context,
      String uuid, OrganizationSearchQuery query) {
    return new SearchQueryFetcher<Organization, OrganizationSearchQuery>().load(context,
        SqDataLoaderKey.ORGANIZATIONS_SEARCH, new ImmutablePair<>(uuid, query));
  }

  public CompletableFuture<List<Organization>> getOrganizationsForPerson(GraphQLContext context,
      String personUuid, Instant when) {
    return when == null
        ? new ForeignKeyFetcher<Organization>().load(context, FkDataLoaderKey.PERSON_ORGANIZATIONS,
            personUuid)
        : new ForeignKeyByDateFetcher<Organization>().load(context,
            FkDataLoaderKey.PERSON_ORGANIZATIONS_WHEN, new ImmutablePair<>(personUuid, when));
  }

  public CompletableFuture<Organization> getOrganizationForPerson(GraphQLContext context,
      String personUuid, Instant when) {
    if (personUuid == null) {
      return CompletableFuture.completedFuture(null);
    }
    return getOrganizationsForPerson(context, personUuid, when)
        .thenApply(l -> l.isEmpty() ? null : l.get(0));
  }

  class AdministratingPositionsBatcher extends ForeignKeyBatcher<Position> {
    private static final String SQL =
        "/* batch.getAdministratingPositionsForOrganization */ SELECT \"organizationAdministrativePositions\".\"organizationUuid\", "
            + PositionDao.POSITION_FIELDS + " FROM \"organizationAdministrativePositions\" "
            + "INNER JOIN positions on positions.uuid = \"organizationAdministrativePositions\".\"positionUuid\" "
            + "WHERE \"organizationAdministrativePositions\".\"organizationUuid\" IN ( <foreignKeys> ) ";

    public AdministratingPositionsBatcher() {
      super(OrganizationDao.this.databaseHandler, SQL, "foreignKeys", new PositionMapper(),
          "organizationUuid");
    }
  }

  public List<List<Position>> getAdministratingPositions(List<String> foreignKeys) {
    return new AdministratingPositionsBatcher().getByForeignKeys(foreignKeys);
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
    List<Organization> getOrgsByShortNames(
        @BindList(value = "shortNames", onEmpty = NULL_STRING) List<String> shortNames);
  }

  @Transactional
  public List<Organization> getOrgsByShortNames(List<String> shortNames) {
    final Handle handle = getDbHandle();
    try {
      if (Utils.isEmptyOrNull(shortNames)) {
        return Collections.emptyList();
      }
      return handle.attach(OrgListQueries.class).getOrgsByShortNames(shortNames);
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public Organization insertInternal(Organization org) {
    final Handle handle = getDbHandle();
    try {
      handle.createUpdate(
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
      final OrganizationBatch ob = handle.attach(OrganizationBatch.class);
      if (org.getAdministratingPositions() != null) {
        ob.insertOrganizationAdministratingPositions(org.getUuid(),
            org.getAdministratingPositions());
      }
      return org;
    } finally {
      closeDbHandle(handle);
    }
  }

  public interface OrganizationBatch {
    @SqlBatch("INSERT INTO \"organizationAdministrativePositions\" (\"organizationUuid\", \"positionUuid\") VALUES (:organizationUuid, :uuid)")
    void insertOrganizationAdministratingPositions(
        @Bind("organizationUuid") String organizationUuid,
        @BindBean List<Position> administratingPositions);
  }

  @Override
  public int updateInternal(Organization org) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate("/* updateOrg */ UPDATE organizations "
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
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int addPositionToOrganization(Position p, Organization o) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate(
          "/* addPositionToOrganization */ INSERT INTO \"organizationAdministrativePositions\" (\"organizationUuid\", \"positionUuid\") "
              + "VALUES (:organizationUuid, :positionUuid)")
          .bind("organizationUuid", o.getUuid()).bind("positionUuid", p.getUuid()).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int removePositionFromOrganization(String positionUuid, Organization o) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate(
          "/* removePositionFromOrganization*/ DELETE FROM \"organizationAdministrativePositions\" "
              + "WHERE \"organizationUuid\" = :organizationUuid AND \"positionUuid\" = :positionUuid")
          .bind("organizationUuid", o.getUuid()).bind("positionUuid", positionUuid).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  public CompletableFuture<List<Position>> getAdministratingPositionsForOrganization(
      GraphQLContext context, String organizationUuid) {
    return new ForeignKeyFetcher<Position>().load(context,
        FkDataLoaderKey.ORGANIZATION_ADMINISTRATIVE_POSITIONS, organizationUuid);
  }

  @Override
  public AnetBeanList<Organization> search(OrganizationSearchQuery query) {
    return new PostgresqlOrganizationSearcher(databaseHandler).runSearch(query);
  }

  @Override
  public SubscriptionUpdateGroup getSubscriptionUpdate(Organization obj) {
    return getCommonSubscriptionUpdate(obj, TABLE_NAME, "organizations.uuid");
  }

  @Transactional
  public int mergeOrganizations(final Organization loserOrganization,
      final Organization winnerOrganization) {
    final Handle handle = getDbHandle();
    try {
      final var loserOrganizationUuid = loserOrganization.getUuid();
      final var winnerOrganizationUuid = winnerOrganization.getUuid();
      final var existingLoserOrg = getByUuid(loserOrganizationUuid);
      final var existingWinnerOrg = getByUuid(winnerOrganizationUuid);
      final var context = engine().getContext();

      // Clear loser's identificationCode to prevent update conflicts (identificationCode must be
      // unique)
      handle
          .createUpdate("/* clearOrganizationIdentificationCode */ UPDATE organizations"
              + " SET \"identificationCode\" = NULL WHERE uuid = :loserOrganizationUuid")
          .bind("loserOrganizationUuid", loserOrganizationUuid).execute();

      // Update the winner's fields
      update(winnerOrganization);

      // Update approvalSteps (note that this may fail if reports are currently pending at one of
      // the
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
      updateForMerge("authorizationGroupRelatedObjects", "relatedObjectUuid",
          winnerOrganizationUuid, loserOrganizationUuid);
      // Update parentOrg (of all sub-organizations) to the winner
      updateForMerge(OrganizationDao.TABLE_NAME, "parentOrgUuid", winnerOrganizationUuid,
          loserOrganizationUuid);
      // Update advisorOrganization of reports to the winner
      updateForMerge(ReportDao.TABLE_NAME, "advisorOrganizationUuid", winnerOrganizationUuid,
          loserOrganizationUuid);
      // Update interlocutorOrganization of reports to the winner
      updateForMerge(ReportDao.TABLE_NAME, "interlocutorOrganizationUuid", winnerOrganizationUuid,
          loserOrganizationUuid);
      // Move notes to the winner
      updateM2mForMerge("noteRelatedObjects", "noteUuid", "relatedObjectUuid",
          winnerOrganizationUuid, loserOrganizationUuid);
      // Move attachments to the winner
      updateM2mForMerge("attachmentRelatedObjects", "attachmentUuid", "relatedObjectUuid",
          winnerOrganizationUuid, loserOrganizationUuid);
      // And update the avatar
      final EntityAvatarDao entityAvatarDao = engine().getEntityAvatarDao();
      entityAvatarDao.delete(OrganizationDao.TABLE_NAME, winnerOrganizationUuid);
      entityAvatarDao.delete(OrganizationDao.TABLE_NAME, loserOrganizationUuid);
      final EntityAvatar winnerEntityAvatar = winnerOrganization.getEntityAvatar();
      if (winnerEntityAvatar != null) {
        winnerEntityAvatar.setRelatedObjectType(OrganizationDao.TABLE_NAME);
        winnerEntityAvatar.setRelatedObjectUuid(winnerOrganizationUuid);
        entityAvatarDao.upsert(winnerEntityAvatar);
      }

      // Update organizationAdministrativePositions
      deleteForMerge("organizationAdministrativePositions", "organizationUuid",
          loserOrganizationUuid);
      Utils.addRemoveElementsByUuid(existingWinnerOrg.loadAdministratingPositions(context).join(),
          Utils.orIfNull(winnerOrganization.getAdministratingPositions(), new ArrayList<>()),
          newPos -> addPositionToOrganization(newPos, winnerOrganization),
          oldPos -> removePositionFromOrganization(DaoUtils.getUuid(oldPos), winnerOrganization));

      // Update emailAddresses
      emailAddressDao.updateEmailAddresses(OrganizationDao.TABLE_NAME, loserOrganizationUuid, null);
      emailAddressDao.updateEmailAddresses(OrganizationDao.TABLE_NAME, winnerOrganizationUuid,
          winnerOrganization.getEmailAddresses());

      // Update customSensitiveInformation for winner
      DaoUtils.saveCustomSensitiveInformation(null, OrganizationDao.TABLE_NAME,
          winnerOrganizationUuid, winnerOrganization.getCustomSensitiveInformation());
      // Delete customSensitiveInformation for loser
      deleteForMerge("customSensitiveInformation", "relatedObjectUuid", loserOrganizationUuid);

      // Finally, delete loser
      final int nrDeleted =
          deleteForMerge(OrganizationDao.TABLE_NAME, "uuid", loserOrganizationUuid);
      if (nrDeleted > 0) {
        adminDao.insertMergedEntity(
            new MergedEntity(loserOrganizationUuid, winnerOrganizationUuid, Instant.now()));
      }
      return nrDeleted;
    } finally {
      closeDbHandle(handle);
    }
  }
}

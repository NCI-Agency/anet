package mil.dds.anet.database;

import graphql.GraphQLContext;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.EntityAvatar;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.MergedEntity;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.database.mappers.LocationMapper;
import mil.dds.anet.search.pg.PostgresqlLocationSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.SqDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.SearchQueryFetcher;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.jdbi.v3.core.Handle;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class LocationDao extends AnetSubscribableObjectDao<Location, LocationSearchQuery> {

  private static final String[] fields = {"uuid", "name", "status", "lat", "lng", "type", "digram",
      "trigram", "description", "createdAt", "updatedAt", "customFields"};
  public static final String TABLE_NAME = "locations";
  public static final String LOCATION_FIELDS = DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  public LocationDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  @Override
  public Location getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  class SelfIdBatcher extends IdBatcher<Location> {
    private static final String SQL = "/* batch.getLocationsByUuids */ SELECT " + LOCATION_FIELDS
        + " FROM locations WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(LocationDao.this.databaseHandler, SQL, "uuids", new LocationMapper());
    }
  }

  @Override
  public List<Location> getByIds(List<String> uuids) {
    return new SelfIdBatcher().getByIds(uuids);
  }

  @Override
  public Location insertInternal(Location l) {
    final Handle handle = getDbHandle();
    try {
      handle.createUpdate(
          "/* locationInsert */ INSERT INTO locations (uuid, name, type, description, status, lat, lng, digram, trigram, "
              + "\"createdAt\", \"updatedAt\", \"customFields\") VALUES (:uuid, :name, :type, :description, :status, "
              + ":lat, :lng, :digram, :trigram, :createdAt, :updatedAt, :customFields)")
          .bindBean(l).bind("createdAt", DaoUtils.asLocalDateTime(l.getCreatedAt()))
          .bind("updatedAt", DaoUtils.asLocalDateTime(l.getUpdatedAt()))
          .bind("status", DaoUtils.getEnumId(l.getStatus()))
          .bind("type", DaoUtils.getEnumString(l.getType())).execute();
      return l;
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public int updateInternal(Location l) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate("/* updateLocation */ UPDATE locations "
          + "SET name = :name, type = :type, description = :description, status = :status, lat = :lat, lng = :lng, "
          + "digram = :digram, trigram = :trigram, "
          + "\"updatedAt\" = :updatedAt, \"customFields\" = :customFields WHERE uuid = :uuid")
          .bindBean(l).bind("updatedAt", DaoUtils.asLocalDateTime(l.getUpdatedAt()))
          .bind("status", DaoUtils.getEnumId(l.getStatus()))
          .bind("type", DaoUtils.getEnumString(l.getType())).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  public AnetBeanList<Location> search(LocationSearchQuery query) {
    return new PostgresqlLocationSearcher(databaseHandler).runSearch(query);
  }

  @Transactional
  public int mergeLocations(Location loserLocation, Location winnerLocation) {
    final String loserLocationUuid = loserLocation.getUuid();
    final String winnerLocationUuid = winnerLocation.getUuid();
    final Location existingLoserLoc = getByUuid(loserLocationUuid);
    final Location existingWinnerLoc = getByUuid(winnerLocationUuid);
    final GraphQLContext context = engine().getContext();

    // Update location
    update(winnerLocation);

    // Update approvalSteps (note that this may fail if reports are currently pending at one of the
    // approvalSteps that are going to be deleted):
    // - delete approvalSteps of loser
    final List<ApprovalStep> existingLoserPlanningApprovalSteps =
        existingLoserLoc.loadPlanningApprovalSteps(context).join();
    final List<ApprovalStep> existingLoserApprovalSteps =
        existingLoserLoc.loadApprovalSteps(context).join();
    Utils.updateApprovalSteps(loserLocation, List.of(), existingLoserPlanningApprovalSteps,
        List.of(), existingLoserApprovalSteps);
    // - update approvalSteps of winner
    final List<ApprovalStep> existingWinnerPlanningApprovalSteps =
        existingWinnerLoc.loadPlanningApprovalSteps(context).join();
    final List<ApprovalStep> existingWinnerApprovalSteps =
        existingWinnerLoc.loadApprovalSteps(context).join();
    Utils.updateApprovalSteps(winnerLocation, winnerLocation.getPlanningApprovalSteps(),
        existingWinnerPlanningApprovalSteps, winnerLocation.getApprovalSteps(),
        existingWinnerApprovalSteps);

    // Update reports
    updateForMerge("reports", "locationUuid", winnerLocationUuid, loserLocationUuid);

    // Update people
    updateForMerge("people", "countryUuid", winnerLocationUuid, loserLocationUuid);

    // Update positions
    updateForMerge("positions", "locationUuid", winnerLocationUuid, loserLocationUuid);

    // Update organizations
    updateForMerge("organizations", "locationUuid", winnerLocationUuid, loserLocationUuid);

    // Update assessments
    updateM2mForMerge("assessmentRelatedObjects", "assessmentUuid", "relatedObjectUuid",
        winnerLocationUuid, loserLocationUuid);

    // Update notes
    updateM2mForMerge("noteRelatedObjects", "noteUuid", "relatedObjectUuid", winnerLocationUuid,
        loserLocationUuid);

    // Update event locations
    updateForMerge("events", "locationUuid", winnerLocationUuid, loserLocationUuid);

    // Update attachments
    updateM2mForMerge("attachmentRelatedObjects", "attachmentUuid", "relatedObjectUuid",
        winnerLocationUuid, loserLocationUuid);
    // Update the avatar
    final EntityAvatarDao entityAvatarDao = engine().getEntityAvatarDao();
    entityAvatarDao.delete(LocationDao.TABLE_NAME, winnerLocationUuid);
    entityAvatarDao.delete(LocationDao.TABLE_NAME, loserLocationUuid);
    final EntityAvatar winnerEntityAvatar = winnerLocation.getEntityAvatar();
    if (winnerEntityAvatar != null) {
      winnerEntityAvatar.setRelatedObjectType(LocationDao.TABLE_NAME);
      winnerEntityAvatar.setRelatedObjectUuid(winnerLocationUuid);
      entityAvatarDao.upsert(winnerEntityAvatar);
    }

    // Update parentLocations:
    // - delete locationRelationships where loser was the child
    deleteForMerge("locationRelationships", "childLocationUuid", loserLocationUuid);
    // - update the winner's parents from the input
    Utils.addRemoveElementsByUuid(existingWinnerLoc.loadParentLocations(context, null).join(),
        Utils.orIfNull(winnerLocation.getParentLocations(), List.of()),
        newOrg -> addLocationRelationship(newOrg, winnerLocation),
        oldOrg -> removeLocationRelationship(oldOrg, winnerLocation));
    // - update the loser's children to the winner
    updateForMerge("locationRelationships", "parentLocationUuid", winnerLocationUuid,
        loserLocationUuid);

    // Update customSensitiveInformation for winner
    DaoUtils.saveCustomSensitiveInformation(Person.SYSTEM_USER, LocationDao.TABLE_NAME,
        winnerLocationUuid, winnerLocation.customSensitiveInformationKey(),
        winnerLocation.getCustomSensitiveInformation());
    // Delete customSensitiveInformation for loser
    deleteForMerge("customSensitiveInformation", "relatedObjectUuid", loserLocationUuid);

    // Update subscriptions
    updateM2mForMerge("subscriptions", "subscriberUuid", "subscribedObjectUuid", winnerLocationUuid,
        loserLocationUuid);
    // Update subscriptionUpdates
    updateForMerge("subscriptionUpdates", "updatedObjectUuid", winnerLocationUuid,
        loserLocationUuid);

    // Finally, delete the location
    final int nrDeleted = deleteForMerge(LocationDao.TABLE_NAME, "uuid", loserLocationUuid);
    if (nrDeleted > 0) {
      engine().getAdminDao().insertMergedEntity(
          new MergedEntity(loserLocationUuid, winnerLocationUuid, Instant.now()));
    }
    return nrDeleted;
  }

  // TODO: Don't delete any location if any references exist.

  @Override
  public SubscriptionUpdateGroup getSubscriptionUpdate(Location obj) {
    return getCommonSubscriptionUpdate(obj, TABLE_NAME, "locations.uuid");
  }

  class LocationSearchBatcher extends SearchQueryBatcher<Location, LocationSearchQuery> {
    public LocationSearchBatcher() {
      super(LocationDao.this);
    }
  }

  public List<List<Location>> getLocationsBySearch(
      List<ImmutablePair<String, LocationSearchQuery>> foreignKeys) {
    return new LocationDao.LocationSearchBatcher().getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<Location>> getLocationsBySearch(GraphQLContext context, String uuid,
      LocationSearchQuery query) {
    return new SearchQueryFetcher<Location, LocationSearchQuery>().load(context,
        SqDataLoaderKey.LOCATIONS_SEARCH, new ImmutablePair<>(uuid, query));
  }

  @Transactional
  public int addLocationRelationship(Location parentLocation, Location childLocation) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* addLocationRelationship */ INSERT INTO \"locationRelationships\""
              + " (\"parentLocationUuid\", \"childLocationUuid\") "
              + "VALUES (:parentLocationUuid, :childLocationUuid)")
          .bind("parentLocationUuid", parentLocation.getUuid())
          .bind("childLocationUuid", childLocation.getUuid()).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  @Transactional
  public int removeLocationRelationship(Location parentLocation, Location childLocation) {
    final Handle handle = getDbHandle();
    try {
      return handle
          .createUpdate("/* removeLocationRelationship*/ DELETE FROM \"locationRelationships\" "
              + "WHERE \"parentLocationUuid\" = :parentLocationUuid "
              + "AND \"childLocationUuid\" = :childLocationUuid")
          .bind("parentLocationUuid", parentLocation.getUuid())
          .bind("childLocationUuid", childLocation.getUuid()).execute();
    } finally {
      closeDbHandle(handle);
    }
  }
}

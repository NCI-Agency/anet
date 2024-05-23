package mil.dds.anet.database;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.MergedEntity;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.database.mappers.LocationMapper;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.FkDataLoaderKey;
import mil.dds.anet.views.ForeignKeyFetcher;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class LocationDao extends AnetSubscribableObjectDao<Location, LocationSearchQuery> {

  private static final String[] fields = {"uuid", "name", "status", "lat", "lng", "type", "digram",
      "trigram", "description", "createdAt", "updatedAt", "customFields"};
  public static final String TABLE_NAME = "locations";
  public static final String LOCATION_FIELDS = DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  @Override
  public Location getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<Location> {

    private static final String sql = "/* batch.getLocationsByUuids */ SELECT " + LOCATION_FIELDS
        + " FROM locations WHERE uuid IN ( <uuids> )";

    public SelfIdBatcher() {
      super(sql, "uuids", new LocationMapper());
    }
  }

  @Override
  public List<Location> getByIds(List<String> uuids) {
    final IdBatcher<Location> idBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
    return idBatcher.getByIds(uuids);
  }

  @Override
  public Location insertInternal(Location l) {
    getDbHandle().createUpdate(
        "/* locationInsert */ INSERT INTO locations (uuid, name, type, description, status, lat, lng, digram, trigram, "
            + "\"createdAt\", \"updatedAt\", \"customFields\") VALUES (:uuid, :name, :type, :description, :status, "
            + ":lat, :lng, :digram, :trigram, :createdAt, :updatedAt, :customFields)")
        .bindBean(l).bind("createdAt", DaoUtils.asLocalDateTime(l.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(l.getUpdatedAt()))
        .bind("status", DaoUtils.getEnumId(l.getStatus()))
        .bind("type", DaoUtils.getEnumString(l.getType())).execute();
    return l;
  }

  @Override
  public int updateInternal(Location l) {
    return getDbHandle().createUpdate("/* updateLocation */ UPDATE locations "
        + "SET name = :name, type = :type, description = :description, status = :status, lat = :lat, lng = :lng, "
        + "digram = :digram, trigram = :trigram, "
        + "\"updatedAt\" = :updatedAt, \"customFields\" = :customFields WHERE uuid = :uuid")
        .bindBean(l).bind("updatedAt", DaoUtils.asLocalDateTime(l.getUpdatedAt()))
        .bind("status", DaoUtils.getEnumId(l.getStatus()))
        .bind("type", DaoUtils.getEnumString(l.getType())).execute();
  }

  @Override
  public AnetBeanList<Location> search(LocationSearchQuery query) {
    return AnetObjectEngine.getInstance().getSearcher().getLocationSearcher().runSearch(query);
  }

  @InTransaction
  public int mergeLocations(Location loserLocation, Location winnerLocation) {
    final String loserLocationUuid = loserLocation.getUuid();
    final String winnerLocationUuid = winnerLocation.getUuid();

    // Update location
    update(winnerLocation);

    // Update approvalSteps
    updateForMerge("approvalSteps", "relatedObjectUuid", winnerLocationUuid, loserLocationUuid);

    // Update reports
    updateForMerge("reports", "locationUuid", winnerLocationUuid, loserLocationUuid);

    // Update people
    updateForMerge("people", "countryUuid", winnerLocationUuid, loserLocationUuid);

    // Update positions
    updateForMerge("positions", "locationUuid", winnerLocationUuid, loserLocationUuid);

    // Update organizations
    updateForMerge("organizations", "locationUuid", winnerLocationUuid, loserLocationUuid);

    // Update notes
    updateM2mForMerge("noteRelatedObjects", "noteUuid", "relatedObjectUuid", winnerLocationUuid,
        loserLocationUuid);

    // Update attachments
    updateM2mForMerge("attachmentRelatedObjects", "attachmentUuid", "relatedObjectUuid",
        winnerLocationUuid, loserLocationUuid);

    // Update customSensitiveInformation for winner
    DaoUtils.saveCustomSensitiveInformation(null, LocationDao.TABLE_NAME, winnerLocationUuid,
        winnerLocation.getCustomSensitiveInformation());
    // Delete customSensitiveInformation for loser
    deleteForMerge("customSensitiveInformation", "relatedObjectUuid", loserLocationUuid);

    // Finally, delete the location
    final int nrDeleted = deleteForMerge(LocationDao.TABLE_NAME, "uuid", loserLocationUuid);
    if (nrDeleted > 0) {
      AnetObjectEngine.getInstance().getAdminDao().insertMergedEntity(
          new MergedEntity(loserLocationUuid, winnerLocationUuid, Instant.now()));
    }
    return nrDeleted;
  }

  // TODO: Don't delete any location if any references exist.

  @Override
  public SubscriptionUpdateGroup getSubscriptionUpdate(Location obj) {
    return getCommonSubscriptionUpdate(obj, TABLE_NAME, "locations.uuid");
  }

  public CompletableFuture<List<Location>> getChildrenLocations(Map<String, Object> context,
      String parentLocationUuid) {
    return new ForeignKeyFetcher<Location>().load(context,
        FkDataLoaderKey.LOCATION_CHILDREN_LOCATIONS, parentLocationUuid);
  }

  static class ChildrenLocationsBatcher extends ForeignKeyBatcher<Location> {
    private static final String sql = "/* batch.getChildrenLocationsForLocation */ SELECT "
        + LOCATION_FIELDS + ", \"locationRelationships\".\"parentLocationUuid\" "
        + "FROM locations, \"locationRelationships\" "
        + "WHERE locations.uuid = \"locationRelationships\".\"childLocationUuid\" "
        + "  AND \"locationRelationships\".\"parentLocationUuid\" IN ( <foreignKeys> ) "
        + "ORDER BY locations.name, locations.uuid";

    public ChildrenLocationsBatcher() {
      super(sql, "foreignKeys", new LocationMapper(), "parentLocationUuid");
    }
  }

  public List<List<Location>> getChildrenLocationsForLocation(List<String> foreignKeys) {
    final ForeignKeyBatcher<Location> childrenLocationsBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(ChildrenLocationsBatcher.class);
    return childrenLocationsBatcher.getByForeignKeys(foreignKeys);
  }

  public CompletableFuture<List<Location>> getParentLocations(Map<String, Object> context,
      String parentLocationUuid) {
    return new ForeignKeyFetcher<Location>().load(context,
        FkDataLoaderKey.LOCATION_PARENT_LOCATIONS, parentLocationUuid);
  }

  static class ParentLocationsBatcher extends ForeignKeyBatcher<Location> {
    private static final String sql = "/* batch.getParentLocationsForLocation */ SELECT "
        + LOCATION_FIELDS + ", \"locationRelationships\".\"childLocationUuid\" "
        + "FROM locations, \"locationRelationships\" "
        + "WHERE locations.uuid = \"locationRelationships\".\"parentLocationUuid\" "
        + "  AND \"locationRelationships\".\"childLocationUuid\" IN ( <foreignKeys> ) "
        + "ORDER BY locations.name, locations.uuid";

    public ParentLocationsBatcher() {
      super(sql, "foreignKeys", new LocationMapper(), "childLocationUuid");
    }
  }

  public List<List<Location>> getParentLocationsForLocation(List<String> foreignKeys) {
    final ForeignKeyBatcher<Location> parentLocationsBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(ParentLocationsBatcher.class);
    return parentLocationsBatcher.getByForeignKeys(foreignKeys);
  }

  @InTransaction
  public int addLocationRelationship(Location parentLocation, Location childLocation) {
    return getDbHandle()
        .createUpdate("/* addLocationRelationship */ INSERT INTO \"locationRelationships\""
            + " (\"parentLocationUuid\", \"childLocationUuid\") "
            + "VALUES (:parentLocationUuid, :childLocationUuid)")
        .bind("parentLocationUuid", parentLocation.getUuid())
        .bind("childLocationUuid", childLocation.getUuid()).execute();
  }

  @InTransaction
  public int removeLocationRelationship(Location parentLocation, Location childLocation) {
    return getDbHandle()
        .createUpdate("/* removeLocationRelationship*/ DELETE FROM \"locationRelationships\" "
            + "WHERE \"parentLocationUuid\" = :parentLocationUuid "
            + "AND \"childLocationUuid\" = :childLocationUuid")
        .bind("parentLocationUuid", parentLocation.getUuid())
        .bind("childLocationUuid", childLocation.getUuid()).execute();
  }
}

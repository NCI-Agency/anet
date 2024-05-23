package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.database.mappers.LocationMapper;
import mil.dds.anet.utils.DaoUtils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class LocationDao extends AnetSubscribableObjectDao<Location, LocationSearchQuery> {

  private static final String[] fields = {"uuid", "name", "status", "lat", "lng", "type", "digram",
      "trigram", "description", "createdAt", "updatedAt", "customFields"};
  public static final String TABLE_NAME = "locations";
  public static final String LOCATION_FIELDS = DaoUtils.buildFieldAliases(TABLE_NAME, fields, true)
      + ", ST_AsGeoJSON(\"locations\".\"geoShape\") AS \"locations_geoShape\"";

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
    System.out.println("LOCATION_FIELDS\n" + LOCATION_FIELDS);
    final IdBatcher<Location> idBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
    return idBatcher.getByIds(uuids);
  }

  @Override
  public Location insertInternal(Location l) {
    getDbHandle().createUpdate(
        "/* locationInsert */ INSERT INTO locations (uuid, name, type, description, status, lat, lng, geoShape, digram, trigram, "
            + "\"createdAt\", \"updatedAt\", \"customFields\") VALUES (:uuid, :name, :type, :description, :status, "
            + ":lat, :lng, :geoShape, :digram, :trigram, :createdAt, :updatedAt, :customFields)")
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
        + "geoShape = ST_GeomFromGeoJSON(:geoShape), " + "digram = :digram, trigram = :trigram, "
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
    return deleteForMerge("locations", "uuid", loserLocationUuid);
  }

  // TODO: Don't delete any location if any references exist.

  @Override
  public SubscriptionUpdateGroup getSubscriptionUpdate(Location obj) {
    return getCommonSubscriptionUpdate(obj, TABLE_NAME, "locations.uuid");
  }
}

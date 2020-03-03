package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.database.mappers.LocationMapper;
import mil.dds.anet.utils.DaoUtils;

public class LocationDao extends AnetBaseDao<Location, LocationSearchQuery> {

  public static final String TABLE_NAME = "locations";

  @Override
  public Location getByUuid(String uuid) {
    return getByIds(Arrays.asList(uuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<Location> {
    private static final String sql =
        "/* batch.getLocationsByUuids */ SELECT * from locations where uuid IN ( <uuids> )";

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
        "/* locationInsert */ INSERT INTO locations (uuid, name, status, lat, lng, \"createdAt\", \"updatedAt\") "
            + "VALUES (:uuid, :name, :status, :lat, :lng, :createdAt, :updatedAt)")
        .bindBean(l).bind("createdAt", DaoUtils.asLocalDateTime(l.getCreatedAt()))
        .bind("updatedAt", DaoUtils.asLocalDateTime(l.getUpdatedAt()))
        .bind("status", DaoUtils.getEnumId(l.getStatus())).execute();
    return l;
  }

  @Override
  public int updateInternal(Location l) {
    return getDbHandle().createUpdate("/* updateLocation */ UPDATE locations "
        + "SET name = :name, status = :status, lat = :lat, lng = :lng, \"updatedAt\" = :updatedAt WHERE uuid = :uuid")
        .bindBean(l).bind("updatedAt", DaoUtils.asLocalDateTime(l.getUpdatedAt()))
        .bind("status", DaoUtils.getEnumId(l.getStatus())).execute();
  }

  @Override
  public AnetBeanList<Location> search(LocationSearchQuery query) {
    return AnetObjectEngine.getInstance().getSearcher().getLocationSearcher().runSearch(query);
  }

  // TODO: Don't delete any location if any references exist.

}

package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Location.LocationType;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class LocationMapper implements RowMapper<Location> {

  @Override
  public Location map(ResultSet rs, StatementContext ctx) throws SQLException {
    Location l = new Location();
    MapperUtils.setCustomizableBeanFields(l, rs, "locations");
    l.setName(rs.getString("locations_name"));
    l.setStatus(MapperUtils.getEnumIdx(rs, "locations_status", Location.Status.class));
    // preserve NULL values; when NULL there are no coordinates set:
    l.setLat(MapperUtils.getOptionalDouble(rs, "locations_lat"));
    l.setLng(MapperUtils.getOptionalDouble(rs, "locations_lng"));
    l.setType(LocationType.valueOfCode(rs.getString("locations_type")));
    l.setDigram(rs.getString("locations_digram"));
    l.setTrigram(rs.getString("locations_trigram"));
    l.setDescription(MapperUtils.getOptionalString(rs, "locations_description"));
    l.setGeoShape(MapperUtils.getOptionalString(rs, "locations_geoShape"));

    if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
      ctx.define("totalCount", rs.getInt("totalCount"));
    }

    return l;
  }


}

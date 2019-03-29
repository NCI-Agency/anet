package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Location.LocationStatus;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class LocationMapper implements RowMapper<Location> {

  @Override
  public Location map(ResultSet rs, StatementContext ctx) throws SQLException {
    Location l = new Location();
    DaoUtils.setCommonBeanFields(l, rs, null);
    l.setName(rs.getString("name"));
    l.setStatus(MapperUtils.getEnumIdx(rs, "status", LocationStatus.class));
    // preserve NULL values; when NULL there are no coordinates set:
    l.setLat(DaoUtils.getOptionalDouble(rs, "lat"));
    l.setLng(DaoUtils.getOptionalDouble(rs, "lng"));

    if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
      ctx.define("totalCount", rs.getInt("totalCount"));
    }

    return l;
  }


}

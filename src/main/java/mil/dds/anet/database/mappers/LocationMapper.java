package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Location.LocationStatus;
import mil.dds.anet.utils.DaoUtils;

public class LocationMapper implements ResultSetMapper<Location> {

	@Override
	public Location map(int index, ResultSet rs, StatementContext ctx) throws SQLException {
		Location l = new Location();
		l.setId(rs.getInt("id"));
		l.setName(rs.getString("name"));
		l.setStatus(MapperUtils.getEnumIdx(rs, "status", LocationStatus.class));
		// preserve NULL values; when NULL there are no coordinates set:
		l.setLat(DaoUtils.getOptionalDouble(rs, "lat"));
		l.setLng(DaoUtils.getOptionalDouble(rs, "lng"));
		l.setCreatedAt(new DateTime(rs.getTimestamp("createdAt")));
		l.setUpdatedAt(new DateTime(rs.getTimestamp("updatedAt")));
		
		if (MapperUtils.containsColumnNamed(rs, "totalCount")) { 
			ctx.setAttribute("totalCount", rs.getInt("totalCount"));
		}
		
		return l;
	}

	
}

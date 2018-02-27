package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Location.LocationStatus;
import mil.dds.anet.views.AbstractAnetBean.LoadLevel;

public class LocationMapper implements ResultSetMapper<Location> {

	@Override
	public Location map(int index, ResultSet rs, StatementContext ctx) throws SQLException {
		Location l = new Location();
		l.setId(rs.getInt("id"));
		l.setName(rs.getString("name"));
		l.setStatus(MapperUtils.getEnumIdx(rs, "status", LocationStatus.class));
		l.setLat(rs.getDouble("lat"));
		l.setLng(rs.getDouble("lng"));
		l.setCreatedAt(new DateTime(rs.getTimestamp("createdAt")));
		l.setUpdatedAt(new DateTime(rs.getTimestamp("updatedAt")));
		l.setLoadLevel(LoadLevel.PROPERTIES);
		
		if (MapperUtils.containsColumnNamed(rs, "totalCount")) { 
			ctx.setAttribute("totalCount", rs.getInt("totalCount"));
		}
		
		return l;
	}

	
}

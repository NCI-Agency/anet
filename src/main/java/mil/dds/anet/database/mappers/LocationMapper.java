package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Location.LocationStatus;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.views.AbstractAnetBean.LoadLevel;

public class LocationMapper implements ResultSetMapper<Location> {

	@Override
	public Location map(int index, ResultSet rs, StatementContext ctx) throws SQLException {
		Location l = new Location();
		DaoUtils.setCommonBeanFields(l, rs, null);
		l.setName(rs.getString("name"));
		l.setStatus(MapperUtils.getEnumIdx(rs, "status", LocationStatus.class));
		// preserve NULL values; when NULL there are no coordinates set:
		l.setLat(DaoUtils.getOptionalDouble(rs, "lat"));
		l.setLng(DaoUtils.getOptionalDouble(rs, "lng"));
		l.setLoadLevel(LoadLevel.PROPERTIES);
		
		if (MapperUtils.containsColumnNamed(rs, "totalCount")) { 
			ctx.setAttribute("totalCount", rs.getInt("totalCount"));
		}
		
		return l;
	}

	
}

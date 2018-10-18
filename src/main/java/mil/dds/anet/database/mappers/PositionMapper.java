package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Position.PositionStatus;
import mil.dds.anet.beans.Position.PositionType;

public class PositionMapper implements ResultSetMapper<Position> {

	@Override
	public Position map(int index, ResultSet rs, StatementContext ctx) throws SQLException {
		//This hits when we do a join but there's no Billet record. 
		if (rs.getObject("positions_id") == null) { return null; }
		
		Position p = fillInFields(new Position(), rs);
		
		if (MapperUtils.containsColumnNamed(rs, "totalCount")) { 
			ctx.setAttribute("totalCount", rs.getInt("totalCount"));
		}
		
		if (MapperUtils.containsColumnNamed(rs, "people_id")) { 
			PersonMapper.fillInFields(p.getPerson(), rs);
		}
		return p;
	}
	
	public static Position fillInFields(Position p, ResultSet rs)  throws SQLException { 
		p.setId(rs.getInt("positions_id"));
		p.setName(rs.getString("positions_name"));
		p.setCode(rs.getString("positions_code"));
		p.setType(MapperUtils.getEnumIdx(rs, "positions_type", PositionType.class));
		p.setStatus(MapperUtils.getEnumIdx(rs, "positions_status", PositionStatus.class));

		Integer orgId = MapperUtils.getInteger(rs, "positions_organizationId");
		if (orgId != null) { 
			p.setOrganization(Organization.createWithId(orgId));
		}
		Integer personId = MapperUtils.getInteger(rs, "positions_currentPersonId");
		if (personId != null) {
			p.setPerson(Person.createWithId(personId));
		}
		
		Integer locationId = MapperUtils.getInteger(rs, "positions_locationId");
		if (locationId != null) { 
			p.setLocation(Location.createWithId(locationId));
		}
		
		p.setCreatedAt(new DateTime(rs.getTimestamp("positions_createdAt")));
		return p;
	}

}

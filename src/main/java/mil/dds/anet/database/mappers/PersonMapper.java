package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;

import org.joda.time.DateTime;
import org.jdbi.v3.core.statement.StatementContext;
import org.jdbi.v3.core.mapper.RowMapper;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Person.PersonStatus;
import mil.dds.anet.beans.Person.Role;
import mil.dds.anet.beans.Position;
import mil.dds.anet.utils.DaoUtils;

public class PersonMapper implements RowMapper<Person> {

	@Override
	public Person map(ResultSet rs, StatementContext ctx) throws SQLException {
		Person p = fillInFields(new Person(), rs);
		
		if (MapperUtils.containsColumnNamed(rs, "positions_uuid")) {
			p.setPosition(PositionMapper.fillInFields(new Position(), rs));
		}
		
		if (MapperUtils.containsColumnNamed(rs, "totalCount")) { 
			ctx.define("totalCount", rs.getInt("totalCount"));
		}
		return p;
	}
	
	public static <T extends Person> T fillInFields(T a, ResultSet r) throws SQLException {
		//This hits when we do a join but there's no Person record. 
		if (r.getObject("people_uuid") == null) { return null; }
		DaoUtils.setCommonBeanFields(a, r, "people");
		a.setName(r.getString("people_name"));
		a.setStatus(MapperUtils.getEnumIdx(r, "people_status", PersonStatus.class));
		a.setRole(MapperUtils.getEnumIdx(r, "people_role", Role.class));
		a.setEmailAddress(r.getString("people_emailAddress"));
		a.setPhoneNumber(r.getString("people_phoneNumber"));
		a.setCountry(r.getString("people_country"));
		a.setGender(r.getString("people_gender"));
		
		Timestamp endOfTourDate = r.getTimestamp("people_endOfTourDate");
		if (endOfTourDate != null) { 
			a.setEndOfTourDate(new DateTime(endOfTourDate));
		}
		
		a.setRank(r.getString("people_rank"));
		a.setBiography(r.getString("people_biography"));
		a.setDomainUsername(r.getString("people_domainUsername"));
		a.setPendingVerification(r.getBoolean("people_pendingVerification"));
		
		return a;
	}
}

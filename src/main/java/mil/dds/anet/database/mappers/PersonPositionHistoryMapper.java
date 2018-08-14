package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.beans.Position;

public class PersonPositionHistoryMapper implements ResultSetMapper<PersonPositionHistory> {

	@Override
	public PersonPositionHistory map(int index, ResultSet rs, StatementContext ctx) throws SQLException {
		final PersonPositionHistory pph = new PersonPositionHistory();
		final DateTime createdAt = new DateTime(rs.getTimestamp("pph_createdAt"));
		pph.setCreatedAt(createdAt);
		final String positionUuid = rs.getString("positionUuid");
		if (positionUuid != null) {
			pph.setPosition(Position.createWithUuid(positionUuid));
		}
		final String personUuid = rs.getString( "personUuid");
		if (personUuid != null) {
			pph.setPerson(Person.createWithUuid(personUuid));
			if (MapperUtils.containsColumnNamed(rs, "people_uuid")) { 
				PersonMapper.fillInFields(pph.getPerson(), rs);
			}
		}
		
		return pph;
	}

}

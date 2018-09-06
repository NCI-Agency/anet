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
		final Integer positionId = MapperUtils.getInteger(rs, "positionId");
		if (positionId != null) {
			pph.setPosition(Position.createWithId(positionId));
		}
		final Integer personId = MapperUtils.getInteger(rs, "personId");
		if (personId != null) {
			pph.setPerson(Person.createWithId(personId));
			if (MapperUtils.containsColumnNamed(rs, "people_id")) { 
				PersonMapper.fillInFields(pph.getPerson(), rs);
			}
		}
		
		return pph;
	}

}

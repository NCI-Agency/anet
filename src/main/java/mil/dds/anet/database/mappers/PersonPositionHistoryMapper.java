package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.joda.time.DateTime;
import org.skife.jdbi.v2.StatementContext;
import org.skife.jdbi.v2.tweak.ResultSetMapper;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.PersonPositionHistory;
import mil.dds.anet.beans.Position;
import mil.dds.anet.utils.DaoUtils;

public class PersonPositionHistoryMapper implements ResultSetMapper<PersonPositionHistory> {

	PersonPositionHistory curr;
	Position position;
	
	public PersonPositionHistoryMapper(Position position) { 
		this.curr = new PersonPositionHistory();
		this.position = position;
		curr.setPosition(position);
	}
	
	@Override
	public PersonPositionHistory map(int index, ResultSet rs, StatementContext ctx) throws SQLException {

		//Each row is a change of the person/position relationship for this person
		//If the personUuid is null that means that the previous person was removed from this entry
		//Otherwise the person with that UUID was placed in this position, and the previous person removed.
		
		//This only returns an entry on rows that are the completion of a person's history in a position. 
		// On a new person placed in a position row: it will create the first half of the History
		// On a person removed from a position row, it will complete the history and return it
		// After we're totally done you can call the getCurrentPerson() which will return the 
		// un-completed record (ie no end-time) for the current person. 
		
		String personUuid = rs.getString("personUuid");
		DateTime createdAt = new DateTime(rs.getTimestamp("pph_createdAt"));
		PersonPositionHistory toReturn = null;

		if (DaoUtils.getUuid(curr.getPerson()) != null) {
			curr.setEndTime(createdAt);
			toReturn = curr;
			curr = new PersonPositionHistory();
			curr.setPosition(position);
			if (personUuid != null) {
				curr.setPerson(Person.createWithUuid(personUuid));
				if (MapperUtils.containsColumnNamed(rs, "people_uuid")) {
					PersonMapper.fillInFields(curr.getPerson(), rs);
				}
				curr.setStartTime(createdAt);
			}
		} else {
			curr.setPerson(Person.createWithUuid(personUuid));
			if (MapperUtils.containsColumnNamed(rs, "people_uuid")) {
				PersonMapper.fillInFields(curr.getPerson(), rs);
			}
			curr.setStartTime(createdAt);
		}
		
		return toReturn;
	}

	/* Used if there is a dangling open person at the end that hasn't been removed
	 * ie there is aperson currently in this position (so, the typical case)
	 * This is designated as a person with a start time but no end time. 
	 */
	public PersonPositionHistory getCurrentPerson() {
		if (curr.getPerson() != null) { return curr; } 
		return null;
	}

}

package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.joda.time.DateTime;
import org.jdbi.v3.core.statement.StatementContext;
import org.jdbi.v3.core.mapper.RowMapper;

import mil.dds.anet.beans.PersonPositionHistory;

public class PersonPositionHistoryMapper implements RowMapper<PersonPositionHistory> {

	@Override
	public PersonPositionHistory map(ResultSet rs, StatementContext ctx) throws SQLException {
		final PersonPositionHistory pph = new PersonPositionHistory();
		final DateTime createdAt = new DateTime(rs.getTimestamp("createdAt"));
		pph.setCreatedAt(createdAt);
		pph.setPositionUuid(rs.getString("positionUuid"));
		pph.setPersonUuid(rs.getString( "personUuid"));
		return pph;
	}

}

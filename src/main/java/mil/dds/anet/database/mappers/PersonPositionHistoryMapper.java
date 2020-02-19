package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.PersonPositionHistory;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class PersonPositionHistoryMapper implements RowMapper<PersonPositionHistory> {

  @Override
  public PersonPositionHistory map(ResultSet rs, StatementContext ctx) throws SQLException {
    final PersonPositionHistory pph = new PersonPositionHistory();
    pph.setCreatedAt(MapperUtils.getInstantAsLocalDateTime(rs, "createdAt"));
    pph.setStartTime(MapperUtils.getInstantAsLocalDateTime(rs, "createdAt"));
    pph.setEndTime(MapperUtils.getInstantAsLocalDateTime(rs, "endedAt"));
    pph.setPositionUuid(rs.getString("positionUuid"));
    pph.setPersonUuid(rs.getString("personUuid"));
    return pph;
  }

}

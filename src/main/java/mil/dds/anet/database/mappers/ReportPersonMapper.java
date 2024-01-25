package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.ReportPerson;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class ReportPersonMapper implements RowMapper<ReportPerson> {

  @Override
  public ReportPerson map(ResultSet r, StatementContext ctx) throws SQLException {
    ReportPerson rp = PersonMapper.fillInFields(new ReportPerson(), r);
    rp.setPrimary(r.getBoolean("isPrimary"));
    rp.setAuthor(r.getBoolean("isAuthor"));
    rp.setAttendee(r.getBoolean("isAttendee"));
    rp.setInterlocutor(r.getBoolean("isInterlocutor"));
    return rp;
  }

}

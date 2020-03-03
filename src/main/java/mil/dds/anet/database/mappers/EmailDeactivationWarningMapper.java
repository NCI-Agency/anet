package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.EmailDeactivationWarning;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class EmailDeactivationWarningMapper implements RowMapper<EmailDeactivationWarning> {

  @Override
  public EmailDeactivationWarning map(final ResultSet r, final StatementContext ctx)
      throws SQLException {
    final EmailDeactivationWarning edw = new EmailDeactivationWarning();

    edw.setPersonUuid(r.getString("personUuid"));
    edw.setSentAt(MapperUtils.getInstantAsLocalDateTime(r, "sentAt"));

    return edw;
  }

}

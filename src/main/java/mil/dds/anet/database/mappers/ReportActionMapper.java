package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.ReportAction;
import mil.dds.anet.beans.ReportAction.ActionType;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class ReportActionMapper implements RowMapper<ReportAction> {

  @Override
  public ReportAction map(ResultSet rs, StatementContext ctx) throws SQLException {
    final ReportAction aa = new ReportAction();
    aa.setPersonUuid(rs.getString("personUuid"));
    aa.setReportUuid(rs.getString("reportUuid"));
    aa.setStepUuid(rs.getString("approvalStepUuid"));
    aa.setCreatedAt(MapperUtils.getInstantAsLocalDateTime(rs, "createdAt"));
    aa.setType(MapperUtils.getEnumIdx(rs, "type", ActionType.class));
    aa.setPlanned(rs.getBoolean("planned"));
    return aa;
  }

}

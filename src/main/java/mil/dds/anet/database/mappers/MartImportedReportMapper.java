package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.mart.MartImportedReport;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class MartImportedReportMapper implements RowMapper<MartImportedReport> {

  @Override
  public MartImportedReport map(ResultSet rs, StatementContext ctx) throws SQLException {
    final MartImportedReport martImportedReport = new MartImportedReport();
    martImportedReport.setPersonUuid(rs.getString("personUuid"));
    martImportedReport.setReportUuid(rs.getString("reportUuid"));
    martImportedReport.setCreatedAt(MapperUtils.getInstantAsLocalDateTime(rs, "createdAt"));
    martImportedReport.setSuccess(rs.getBoolean("success"));
    martImportedReport.setErrors(rs.getString("errors"));

    if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
      ctx.define("totalCount", rs.getInt("totalCount"));
    }

    return martImportedReport;
  }
}

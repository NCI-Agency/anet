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
    martImportedReport.setPersonUuid(rs.getString("martImportedReports_personUuid"));
    martImportedReport.setReportUuid(rs.getString("martImportedReports_reportUuid"));
    martImportedReport.setSubmittedAt(
        MapperUtils.getInstantAsLocalDateTime(rs, "martImportedReports_submittedAt"));
    martImportedReport
        .setReceivedAt(MapperUtils.getInstantAsLocalDateTime(rs, "martImportedReports_receivedAt"));
    martImportedReport.setSequence(rs.getLong("martImportedReports_sequence"));
    martImportedReport.setState(
        MapperUtils.getEnumIdx(rs, "martImportedReports_state", MartImportedReport.State.class));
    martImportedReport.setErrors(rs.getString("martImportedReports_errors"));

    if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
      ctx.define("totalCount", rs.getInt("totalCount"));
    }

    return martImportedReport;
  }
}

package mil.dds.anet.database.mappers;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.invoke.MethodHandles;
import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.mart.MartImportedReport;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MartImportedReportMapper implements RowMapper<MartImportedReport> {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  ObjectMapper mapper;

  public MartImportedReportMapper() {
    this.mapper = MapperUtils.getDefaultMapper();
  }

  @Override
  public MartImportedReport map(ResultSet rs, StatementContext ctx) throws SQLException {
    try {
      MartImportedReport martImportedReport = new MartImportedReport();

      martImportedReport.setPersonUuid(rs.getString("personUuid"));
      martImportedReport.setReportUuid(rs.getString("reportUuid"));
      martImportedReport.setCreatedAt(MapperUtils.getInstantAsLocalDateTime(rs, "createdAt"));
      martImportedReport.setSuccess(rs.getBoolean("success"));
      martImportedReport.setErrors(rs.getString("errors"));

      if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
        ctx.define("totalCount", rs.getInt("totalCount"));
      }

      return martImportedReport;
    } catch (Exception e) {
      logger.error("Error mapping MART imported report", e);
    }
    return null;
  }
}

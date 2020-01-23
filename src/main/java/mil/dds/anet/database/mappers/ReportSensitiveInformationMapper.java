package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.ReportSensitiveInformation;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class ReportSensitiveInformationMapper implements RowMapper<ReportSensitiveInformation> {

  @Override
  public ReportSensitiveInformation map(ResultSet rs, StatementContext ctx) throws SQLException {
    final ReportSensitiveInformation rsi = new ReportSensitiveInformation();
    MapperUtils.setCommonBeanFields(rsi, rs, "reportsSensitiveInformation");
    rsi.setText(rs.getString("reportsSensitiveInformation_text"));
    return rsi;
  }

}

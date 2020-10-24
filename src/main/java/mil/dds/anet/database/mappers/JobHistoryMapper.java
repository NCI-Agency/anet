package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.JobHistory;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class JobHistoryMapper implements RowMapper<JobHistory> {

  @Override
  public JobHistory map(ResultSet rs, StatementContext ctx) throws SQLException {
    final JobHistory jh = new JobHistory();
    jh.setJobName(rs.getString("jobName"));
    jh.setLastRun(MapperUtils.getInstantAsLocalDateTime(rs, "lastRun"));
    return jh;
  }

}

package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.Assessment;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class AssessmentMapper implements RowMapper<Assessment> {

  @Override
  public Assessment map(ResultSet rs, StatementContext ctx) throws SQLException {
    final Assessment a = new Assessment();
    MapperUtils.setCommonBeanFields(a, rs, null);
    a.setAssessmentKey(rs.getString("assessmentKey"));
    a.setAssessmentValues(rs.getString("assessmentValues"));
    a.setAuthorUuid(rs.getString("authorUuid"));

    if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
      ctx.define("totalCount", rs.getInt("totalCount"));
    }

    return a;
  }

}

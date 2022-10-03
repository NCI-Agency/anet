package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.UserActivity;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class UserActivityMapper implements RowMapper<UserActivity> {
  @Override
  public UserActivity map(final ResultSet rs, final StatementContext ctx) throws SQLException {
    final UserActivity ua = new UserActivity();
    if (MapperUtils.containsColumnNamed(rs, "organizationUuid")) {
      ua.setOrganizationUuid(rs.getString("organizationUuid"));
    }
    if (MapperUtils.containsColumnNamed(rs, "personUuid")) {
      ua.setPersonUuid(rs.getString("personUuid"));
    }
    ua.setVisitedAt(MapperUtils.getInstantAsLocalDateTime(rs, "aggregatedDate"));
    ua.setCount(rs.getLong("count"));
    if (MapperUtils.containsColumnNamed(rs, MapperUtils.TOTAL_COUNT_COLUMN)) {
      ctx.define(MapperUtils.TOTAL_COUNT_COLUMN, rs.getInt(MapperUtils.TOTAL_COUNT_COLUMN));
    }
    return ua;
  }
}

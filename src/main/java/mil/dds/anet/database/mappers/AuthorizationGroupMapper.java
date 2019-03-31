package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.AuthorizationGroup.AuthorizationGroupStatus;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class AuthorizationGroupMapper implements RowMapper<AuthorizationGroup> {

  @Override
  public AuthorizationGroup map(ResultSet rs, StatementContext ctx) throws SQLException {
    final AuthorizationGroup a = new AuthorizationGroup();
    DaoUtils.setCommonBeanFields(a, rs, null);
    a.setName(rs.getString("name"));
    a.setDescription(rs.getString("description"));
    a.setStatus(MapperUtils.getEnumIdx(rs, "status", AuthorizationGroupStatus.class));

    if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
      ctx.define("totalCount", rs.getInt("totalCount"));
    }

    return a;
  }

}

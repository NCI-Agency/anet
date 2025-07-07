package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.AuthorizationGroup;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class AuthorizationGroupMapper implements RowMapper<AuthorizationGroup> {

  @Override
  public AuthorizationGroup map(ResultSet rs, StatementContext ctx) throws SQLException {
    final AuthorizationGroup a = new AuthorizationGroup();
    MapperUtils.setCommonBeanFields(a, rs, "authorizationGroups");
    a.setName(rs.getString("authorizationGroups_name"));
    a.setDescription(rs.getString("authorizationGroups_description"));
    a.setStatus(
        MapperUtils.getEnumIdx(rs, "authorizationGroups_status", AuthorizationGroup.Status.class));
    a.setDistributionList(rs.getBoolean("authorizationGroups_distributionList"));
    a.setForSensitiveInformation(rs.getBoolean("authorizationGroups_forSensitiveInformation"));

    if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
      ctx.define("totalCount", rs.getInt("totalCount"));
    }

    return a;
  }

}

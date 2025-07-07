package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.User;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class UserMapper implements RowMapper<User> {

  @Override
  public User map(ResultSet rs, StatementContext ctx) throws SQLException {
    // This hits when we do a join but there's no User record.
    if (rs.getObject("users_uuid") == null) {
      return null;
    }

    return fillInFields(new User(), rs);
  }

  public static User fillInFields(User u, ResultSet rs) throws SQLException {
    MapperUtils.setCommonBeanFields(u, rs, "users");
    u.setUuid(rs.getString("users_uuid"));
    u.setDomainUsername(rs.getString("users_domainUsername"));
    u.setPersonUuid(rs.getString("users_personUuid"));
    return u;
  }
}

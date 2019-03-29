package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class TagMapper implements RowMapper<Tag> {

  @Override
  public Tag map(ResultSet rs, StatementContext ctx) throws SQLException {
    final Tag t = new Tag();
    DaoUtils.setCommonBeanFields(t, rs, null);
    t.setName(rs.getString("name"));
    t.setDescription(rs.getString("description"));

    if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
      ctx.define("totalCount", rs.getInt("totalCount"));
    }

    return t;
  }

}

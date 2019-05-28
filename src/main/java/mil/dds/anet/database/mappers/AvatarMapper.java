package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.Avatar;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class AvatarMapper implements RowMapper<Avatar> {

  @Override
  public Avatar map(ResultSet rs, StatementContext ctx) throws SQLException {
    final Avatar n = new Avatar();
    DaoUtils.setCommonBeanFields(n, rs, null);
    n.setImageData(rs.getString("imageData"));
    n.setPersonUuid(rs.getString("personUuid"));

    if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
      ctx.define("totalCount", rs.getInt("totalCount"));
    }

    return n;
  }

}

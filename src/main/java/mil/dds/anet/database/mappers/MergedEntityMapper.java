package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.MergedEntity;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class MergedEntityMapper implements RowMapper<MergedEntity> {

  @Override
  public MergedEntity map(ResultSet rs, StatementContext ctx) throws SQLException {
    return new MergedEntity(rs.getString("oldUuid"), rs.getString("newUuid"),
        MapperUtils.getInstantAsLocalDateTime(rs, "createdAt"));
  }

}

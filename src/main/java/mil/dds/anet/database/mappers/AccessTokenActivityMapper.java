package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.AccessTokenActivity;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class AccessTokenActivityMapper implements RowMapper<AccessTokenActivity> {
  @Override
  public AccessTokenActivity map(ResultSet rs, StatementContext ctx) throws SQLException {
    final AccessTokenActivity lta = new AccessTokenActivity();
    lta.setAccessTokenUuid(rs.getString("accessTokenUuid"));
    lta.setVisitedAt(MapperUtils.getInstantAsLocalDateTime(rs, "visitedAt"));
    lta.setRemoteAddress(rs.getString("remoteAddress"));
    return lta;
  }
}

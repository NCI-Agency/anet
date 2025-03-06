package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.AccessToken;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class AccessTokenMapper implements RowMapper<AccessToken> {
  @Override
  public AccessToken map(ResultSet rs, StatementContext ctx) throws SQLException {
    final AccessToken accessToken = new AccessToken();
    accessToken.setUuid(rs.getString("uuid"));
    accessToken.setName(rs.getString("name"));
    accessToken.setScope(AccessToken.TokenScope.valueOf(rs.getString("scope")));
    accessToken.setDescription(MapperUtils.getOptionalString(rs, "description"));
    accessToken.setTokenHash(rs.getString("tokenHash"));
    accessToken.setCreatedAt(MapperUtils.getInstantAsLocalDateTime(rs, "createdAt"));
    accessToken.setExpiresAt(MapperUtils.getInstantAsLocalDateTime(rs, "expiresAt"));
    return accessToken;
  }
}

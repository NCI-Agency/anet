package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.AuthorizationGroupRelatedObject;
import mil.dds.anet.database.mappers.MapperUtils;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class AuthorizationGroupRelatedObjectMapper
    implements RowMapper<AuthorizationGroupRelatedObject> {

  private final String uuidField;

  public AuthorizationGroupRelatedObjectMapper(final String uuidField) {
    super();
    this.uuidField = uuidField;
  }

  @Override
  public AuthorizationGroupRelatedObject map(ResultSet rs, StatementContext ctx)
      throws SQLException {
    final AuthorizationGroupRelatedObject ag = new AuthorizationGroupRelatedObject();
    ag.setObjectUuid(rs.getString(uuidField));
    ag.setRelatedObjectType(rs.getString("relatedObjectType"));
    ag.setRelatedObjectUuid(rs.getString("relatedObjectUuid"));
    if (MapperUtils.containsColumnNamed(rs, "priority")) {
      ag.setPriority(MapperUtils.getOptionalDouble(rs, "priority"));
    }
    return ag;
  }
}

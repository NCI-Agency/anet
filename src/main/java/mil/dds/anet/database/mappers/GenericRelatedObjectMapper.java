package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.GenericRelatedObject;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class GenericRelatedObjectMapper implements RowMapper<GenericRelatedObject> {

  private final String uuidField;

  public GenericRelatedObjectMapper(final String uuidField) {
    super();
    this.uuidField = uuidField;
  }

  @Override
  public GenericRelatedObject map(ResultSet rs, StatementContext ctx) throws SQLException {
    final GenericRelatedObject gro = new GenericRelatedObject();
    gro.setObjectUuid(rs.getString(uuidField));
    gro.setRelatedObjectType(rs.getString("relatedObjectType"));
    gro.setRelatedObjectUuid(rs.getString("relatedObjectUuid"));
    return gro;
  }

}

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
    final GenericRelatedObject nro = new GenericRelatedObject();
    nro.setObjectUuid(rs.getString(uuidField));
    nro.setRelatedObjectType(rs.getString("relatedObjectType"));
    nro.setRelatedObjectUuid(rs.getString("relatedObjectUuid"));
    return nro;
  }

}

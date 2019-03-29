package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.NoteRelatedObject;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class NoteRelatedObjectMapper implements RowMapper<NoteRelatedObject> {

  @Override
  public NoteRelatedObject map(ResultSet rs, StatementContext ctx) throws SQLException {
    final NoteRelatedObject nro = new NoteRelatedObject();
    nro.setNoteUuid(rs.getString("noteUuid"));
    nro.setRelatedObjectType(rs.getString("relatedObjectType"));
    nro.setRelatedObjectUuid(rs.getString("relatedObjectUuid"));
    return nro;
  }

}

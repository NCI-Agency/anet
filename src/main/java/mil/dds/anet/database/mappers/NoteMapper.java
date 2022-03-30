package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.Note.NoteType;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class NoteMapper implements RowMapper<Note> {

  @Override
  public Note map(ResultSet rs, StatementContext ctx) throws SQLException {
    final Note n = new Note();
    MapperUtils.setCommonBeanFields(n, rs, null);
    n.setType(MapperUtils.getEnumIdx(rs, "type", NoteType.class));
    n.setAssessmentKey(rs.getString("assessmentKey"));
    n.setText(rs.getString("text"));
    n.setAuthorUuid(rs.getString("authorUuid"));

    if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
      ctx.define("totalCount", rs.getInt("totalCount"));
    }

    return n;
  }

}

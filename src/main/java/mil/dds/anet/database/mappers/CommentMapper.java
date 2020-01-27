package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.Comment;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class CommentMapper implements RowMapper<Comment> {

  @Override
  public Comment map(ResultSet r, StatementContext ctx) throws SQLException {
    final Comment c = new Comment();
    MapperUtils.setCommonBeanFields(c, r, "comments");
    c.setReportUuid(r.getString("comments_reportUuid"));
    c.setAuthorUuid(r.getString("comments_authorUuid"));
    c.setText(r.getString("comments_text"));
    return c;
  }

}

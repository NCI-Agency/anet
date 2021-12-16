package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.Attachment;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class AttachmentMapper implements RowMapper<Attachment> {
  @Override
  public Attachment map(ResultSet rs, StatementContext ctx) throws SQLException {
    final Attachment a = new Attachment();
    MapperUtils.setCommonBeanFields(a, rs, null);
    a.setMimeType(rs.getString("mimeType"));
    a.setContent(rs.getBytes("content"));
    a.setFileName(rs.getString("fileName"));
    a.setDescription(rs.getString("description"));
    a.setClassificationUuid(rs.getString("classification"));
    a.setRelatedObjectType(rs.getString("relatedObjectType"));
    a.setRelatedObjectUuid(rs.getString("relatedObjectUuid"));
    return a;
  }
}

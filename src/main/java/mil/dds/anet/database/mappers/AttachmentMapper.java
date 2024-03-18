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
    MapperUtils.setCommonBeanFields(a, rs, "attachments");
    a.setMimeType(MapperUtils.getOptionalString(rs, "attachments_mimeType"));
    a.setAuthorUuid(MapperUtils.getOptionalString(rs, "attachments_authorUuid"));
    a.setContentLength(MapperUtils.getOptionalLong(rs, "attachments_contentLength"));
    a.setFileName(MapperUtils.getOptionalString(rs, "attachments_fileName"));
    a.setDescription(MapperUtils.getOptionalString(rs, "attachments_description"));
    a.setClassification(MapperUtils.getOptionalString(rs, "attachments_classification"));
    a.setCaption(MapperUtils.getOptionalString(rs, "attachments_caption"));

    if (MapperUtils.containsColumnNamed(rs, "totalCount")) {
      ctx.define("totalCount", rs.getInt("totalCount"));
    }

    return a;
  }
}

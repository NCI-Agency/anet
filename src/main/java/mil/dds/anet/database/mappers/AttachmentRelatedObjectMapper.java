package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.AttachmentRelatedObject;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class AttachmentRelatedObjectMapper implements RowMapper<AttachmentRelatedObject> {

  @Override
  public AttachmentRelatedObject map(ResultSet rs, StatementContext ctx) throws SQLException {
    final AttachmentRelatedObject aro = new AttachmentRelatedObject();
    aro.setAttachmentUuid(rs.getString("attachmentUuid"));
    aro.setRelatedObjectType(rs.getString("relatedObjectType"));
    aro.setRelatedObjectUuid(rs.getString("relatedObjectUuid"));
    return aro;
  }
}

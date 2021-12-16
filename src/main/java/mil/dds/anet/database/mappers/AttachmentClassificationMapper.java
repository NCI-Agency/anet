package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.AttachmentClassification;
import mil.dds.anet.beans.AttachmentClassification.Classification;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class AttachmentClassificationMapper implements RowMapper<AttachmentClassification> {
  @Override
  public AttachmentClassification map(ResultSet rs, StatementContext ctx) throws SQLException {
    final AttachmentClassification a = new AttachmentClassification();
    MapperUtils.setCommonBeanFields(a, rs, null);
    a.setClassification(MapperUtils.getEnumIdx(rs, "classification", Classification.class));
    return a;
  }
}

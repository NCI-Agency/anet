package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.CustomSensitiveInformation;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class CustomSensitiveInformationMapper implements RowMapper<CustomSensitiveInformation> {

  @Override
  public CustomSensitiveInformation map(ResultSet rs, StatementContext ctx) throws SQLException {
    final CustomSensitiveInformation csi = new CustomSensitiveInformation();
    MapperUtils.setCommonBeanFields(csi, rs, null);
    csi.setCustomFieldName(rs.getString("customFieldName"));
    csi.setCustomFieldValue(rs.getString("customFieldValue"));
    csi.setRelatedObjectType(rs.getString("relatedObjectType"));
    csi.setRelatedObjectUuid(rs.getString("relatedObjectUuid"));
    return csi;
  }

}

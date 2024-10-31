package mil.dds.anet.database.mappers;

import java.sql.ResultSet;
import java.sql.SQLException;
import mil.dds.anet.beans.EntityAvatar;
import org.jdbi.v3.core.mapper.RowMapper;
import org.jdbi.v3.core.statement.StatementContext;

public class EntityAvatarMapper implements RowMapper<EntityAvatar> {
  @Override
  public EntityAvatar map(ResultSet rs, StatementContext ctx) throws SQLException {
    final EntityAvatar entityAvatar = new EntityAvatar();
    entityAvatar.setRelatedObjectType(rs.getString("relatedObjectType"));
    entityAvatar.setRelatedObjectUuid(rs.getString("relatedObjectUuid"));
    entityAvatar.setApplyCrop(rs.getBoolean("applyCrop"));
    entityAvatar.setAttachmentUuid(rs.getString("attachmentUuid"));
    entityAvatar.setCropLeft(rs.getInt("cropLeft"));
    entityAvatar.setCropTop(rs.getInt("cropTop"));
    entityAvatar.setCropWidth(rs.getInt("cropWidth"));
    entityAvatar.setCropHeight(rs.getInt("cropHeight"));
    return entityAvatar;
  }
}

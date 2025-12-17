package mil.dds.anet.database;

import java.util.Arrays;
import java.util.List;
import mil.dds.anet.beans.EntityAvatar;
import mil.dds.anet.database.mappers.EntityAvatarMapper;
import org.jdbi.v3.core.Handle;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class EntityAvatarDao extends AbstractDao {
  public static final String TABLE_NAME = "entityAvatars";

  public EntityAvatarDao(DatabaseHandler databaseHandler) {
    super(databaseHandler);
  }

  public EntityAvatar getByRelatedObjectUuid(String relatedObjectUuid) {
    return getByIds(Arrays.asList(relatedObjectUuid)).get(0);
  }

  class SelfIdBatcher extends IdBatcher<EntityAvatar> {
    private static final String SQL = "/* batch.getEntityAvatarForRelatedObject */ "
        + "SELECT * FROM \"entityAvatars\" WHERE \"relatedObjectUuid\" IN ( <relatedObjectUuids> )";

    public SelfIdBatcher() {
      super(EntityAvatarDao.this.databaseHandler, SQL, "relatedObjectUuids",
          new EntityAvatarMapper());
    }
  }

  public List<EntityAvatar> getByIds(List<String> relatedObjectUuids) {
    return new SelfIdBatcher().getByIds(relatedObjectUuids);
  }

  /**
   * Inserts or updates avatar in the database
   *
   * @param entityAvatar the entity avatar
   * @return number of rows inserted/updated
   */
  @Transactional
  public int upsert(final EntityAvatar entityAvatar) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate("/* upsertEntityAvatar */ INSERT INTO \"entityAvatars\" "
          + "(\"relatedObjectType\", \"relatedObjectUuid\", \"attachmentUuid\", \"applyCrop\", "
          + "\"cropLeft\", \"cropTop\", \"cropWidth\", \"cropHeight\") "
          + "VALUES (:relatedObjectType, :relatedObjectUuid, :attachmentUuid, :applyCrop, "
          + ":cropLeft, :cropTop, :cropWidth, :cropHeight) "
          + "ON CONFLICT (\"relatedObjectType\", \"relatedObjectUuid\") DO UPDATE "
          + "SET \"attachmentUuid\" = :attachmentUuid, \"cropLeft\" = :cropLeft, \"applyCrop\" = :applyCrop, "
          + "\"cropTop\" = :cropTop, \"cropWidth\" = :cropWidth, \"cropHeight\" = :cropHeight")
          .bindBean(entityAvatar).execute();
    } finally {
      closeDbHandle(handle);
    }
  }

  /**
   * Deletes the entity avatar in the database
   *
   * @param relatedObjectType the relatedObjectType for which to delete the avatar
   * @param relatedObjectUuid the relatedObjectUuid for which to delete the avatar
   * @return number of rows deleted
   */
  @Transactional
  public int delete(final String relatedObjectType, final String relatedObjectUuid) {
    final Handle handle = getDbHandle();
    try {
      return handle.createUpdate("/* deleteEntityAvatar */ DELETE FROM \"entityAvatars\" "
          + "WHERE \"relatedObjectType\" = :relatedObjectType AND \"relatedObjectUuid\" = :relatedObjectUuid")
          .bind("relatedObjectType", relatedObjectType).bind("relatedObjectUuid", relatedObjectUuid)
          .execute();
    } finally {
      closeDbHandle(handle);
    }
  }
}

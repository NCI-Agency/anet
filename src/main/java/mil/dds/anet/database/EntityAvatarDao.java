package mil.dds.anet.database;

import jakarta.inject.Inject;
import jakarta.inject.Provider;
import java.util.Arrays;
import java.util.List;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.EntityAvatar;
import mil.dds.anet.database.mappers.EntityAvatarMapper;
import org.jdbi.v3.core.Handle;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class EntityAvatarDao {
  public static final String TABLE_NAME = "entityAvatars";

  @Inject
  private Provider<Handle> handle;

  protected Handle getDbHandle() {
    return handle.get();
  }

  public EntityAvatar getByRelatedObjectUuid(String relatedObjectUuid) {
    return getByIds(Arrays.asList(relatedObjectUuid)).get(0);
  }

  static class SelfIdBatcher extends IdBatcher<EntityAvatar> {
    private static final String sql = "/* batch.getEntityAvatarForRelatedObject */ "
        + "SELECT * FROM \"entityAvatars\" WHERE \"relatedObjectUuid\" IN ( <relatedObjectUuids> )";

    public SelfIdBatcher() {
      super(sql, "relatedObjectUuids", new EntityAvatarMapper());
    }
  }

  public List<EntityAvatar> getByIds(List<String> relatedObjectUuids) {
    final IdBatcher<EntityAvatar> idBatcher =
        AnetObjectEngine.getInstance().getInjector().getInstance(SelfIdBatcher.class);
    return idBatcher.getByIds(relatedObjectUuids);
  }

  /**
   * Inserts avatar in the database
   * 
   * @param entityAvatar the new entity avatar
   * @return number of rows inserted
   */
  @InTransaction
  public int insert(final EntityAvatar entityAvatar) {
    return getDbHandle().createUpdate("/* insertEntityAvatar */ " + "INSERT INTO \"entityAvatars\" "
        + "(\"relatedObjectType\", \"relatedObjectUuid\", \"attachmentUuid\", \"applyCrop\", "
        + "\"cropLeft\", \"cropTop\", \"cropWidth\", \"cropHeight\") "
        + "VALUES (:relatedObjectType, :relatedObjectUuid, :attachmentUuid, :applyCrop, "
        + ":cropLeft, :cropTop, :cropWidth, :cropHeight)").bindBean(entityAvatar).execute();
  }

  /**
   * Updates avatar in the database
   * 
   * @param entityAvatar the entity avatar to update
   * @return number of rows updated
   */
  @InTransaction
  public int update(final EntityAvatar entityAvatar) {
    return getDbHandle().createUpdate("/* updateEntityAvatar */ UPDATE \"entityAvatars\" "
        + "SET \"attachmentUuid\" = :attachmentUuid, \"cropLeft\" = :cropLeft, \"applyCrop\" = :applyCrop, "
        + "\"cropTop\" = :cropTop, \"cropWidth\" = :cropWidth, \"cropHeight\" = :cropHeight "
        + "WHERE \"relatedObjectType\" = :relatedObjectType AND \"relatedObjectUuid\" = :relatedObjectUuid")
        .bindBean(entityAvatar).execute();
  }

  /**
   * Deletes the entity avatar in the database
   *
   * @param relatedObjectType the relatedObjectType for which to delete the avatar
   * @param relatedObjectUuid the relatedObjectUuid for which to delete the avatar
   * @return number of rows deleted
   */
  @InTransaction
  public int delete(final String relatedObjectType, final String relatedObjectUuid) {
    return getDbHandle().createUpdate(
        "/* deletEntityAvatar */ DELETE FROM \"entityAvatars\" WHERE \"relatedObjectType\" = :relatedObjectType AND \"relatedObjectUuid\" = :relatedObjectUuid")
        .bind("relatedObjectType", relatedObjectType).bind("relatedObjectUuid", relatedObjectUuid)
        .execute();
  }
}

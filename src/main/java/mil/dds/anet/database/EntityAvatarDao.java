package mil.dds.anet.database;

import jakarta.inject.Inject;
import jakarta.inject.Provider;
import java.util.Optional;
import mil.dds.anet.beans.EntityAvatar;
import org.jdbi.v3.core.Handle;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class EntityAvatarDao {
  @Inject
  private Provider<Handle> handle;

  protected Handle getDbHandle() {
    return handle.get();
  }

  /**
   * Gets the existing avatar for this relatedObject if any
   *
   * @param relatedObjectType the relatedObjectType
   * @param relatedObjectUuid the relatedObjectUuid
   * @return optional with the avatar
   */
  @InTransaction
  public Optional<EntityAvatar> getByRelatedObject(final String relatedObjectType,
      final String relatedObjectUuid) {
    return getDbHandle().createQuery(
        "SELECT * FROM \"entityAvatars\" WHERE \"relatedObjectType\" = :relatedObjectType AND \"relatedObjectUuid\" = :relatedObjectUuid")
        .bind("relatedObjectType", relatedObjectType).bind("relatedObjectUuid", relatedObjectUuid)
        .mapToBean(EntityAvatar.class).findOne();
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

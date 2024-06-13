package mil.dds.anet.database;

import jakarta.inject.Inject;
import jakarta.inject.Provider;
import java.util.Optional;
import mil.dds.anet.beans.*;
import org.jdbi.v3.core.Handle;

public class EntityAvatarDao {
  @Inject
  private Provider<Handle> handle;

  protected Handle getDbHandle() {
    return handle.get();
  }

  /**
   * Gets the existing avatar for this entity Uuid if any
   * 
   * @param entityUuid the entity uuid
   * @return optional with the avatar
   */
  public Optional<EntityAvatar> getByEntityUuid(final String entityUuid) {
    return getDbHandle()
        .createQuery("SELECT * FROM \"entityAvatars\" WHERE \"entityUuid\" = :entityUuid")
        .bind("entityUuid", entityUuid).mapToBean(EntityAvatar.class).findOne();
  }

  /**
   * Inserts avatar in the database
   * 
   * @param entityAvatar the new entity avatar
   * @return number of rows inserted
   */
  public int insertInternal(EntityAvatar entityAvatar) {
    return getDbHandle().createUpdate("/* insertEntityAvatar */ "
        + "INSERT INTO \"entityAvatars\" (\"entityUuid\", \"attachmentUuid\", \"cropLeft\", \"cropTop\", \"cropWidth\", \"cropHeight\")"
        + "VALUES (:entityUuid, :attachmentUuid, :cropLeft, :cropTop, :cropWidth, :cropHeight)")
        .bindBean(entityAvatar).execute();
  }

  /**
   * Updates avatar in the database
   * 
   * @param entityAvatar the entity avatar to update
   * @return number of rows updated
   */
  public int updateInternal(EntityAvatar entityAvatar) {
    return getDbHandle().createUpdate(
        "/* updateEntityAvatar */ UPDATE \"entityAvatars\" SET \"attachmentUuid\" = :attachmentUuid, \"cropLeft\" = :cropLeft, \"cropTop\" = :cropTop, \"cropWidth\" = :cropWidth, \"cropHeight\" = :cropHeight WHERE \"entityUuid\" = :entityUuid")
        .bindBean(entityAvatar).execute();
  }

  /**
   * Deletes the entity avatar in the database
   * 
   * @param entityUuid the entity for which to delete the avatar
   * @return number of rows deleted
   */
  public int deleteInternal(String entityUuid) {
    return getDbHandle().createUpdate(
        "/* deletEntityAvatar */ DELETE FROM \"entityAvatars\" WHERE \"entityUuid\" = :entityUuid")
        .bind("entityUuid", entityUuid).execute();
  }
}

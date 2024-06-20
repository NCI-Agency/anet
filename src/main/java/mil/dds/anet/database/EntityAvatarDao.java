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
   * Gets the existing avatar for this relatedObjectUuid if any
   * 
   * @param relatedObjectUuid the relatedObjectUuid
   * @return optional with the avatar
   */
  @InTransaction
  public Optional<EntityAvatar> getByRelatedObjectUuid(final String relatedObjectUuid) {
    return getDbHandle()
        .createQuery(
            "SELECT * FROM \"entityAvatars\" WHERE \"relatedObjectUuid\" = :relatedObjectUuid")
        .bind("relatedObjectUuid", relatedObjectUuid).mapToBean(EntityAvatar.class).findOne();
  }

  /**
   * Inserts avatar in the database
   * 
   * @param entityAvatar the new entity avatar
   * @return number of rows inserted
   */
  @InTransaction
  public int insert(EntityAvatar entityAvatar) {
    return getDbHandle().createUpdate("/* insertEntityAvatar */ " + "INSERT INTO \"entityAvatars\" "
        + "(\"relatedObjectType\", \"relatedObjectUuid\", \"attachmentUuid\", \"applyCrop\", "
        + "\"cropLeft\", \"cropTop\", \"cropWidth\", \"cropHeight\")"
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
  public int update(EntityAvatar entityAvatar) {
    return getDbHandle().createUpdate("/* updateEntityAvatar */ UPDATE \"entityAvatars\" "
        + "SET \"attachmentUuid\" = :attachmentUuid, \"cropLeft\" = :cropLeft, \"applyCrop\" = :applyCrop, "
        + "\"cropTop\" = :cropTop, \"cropWidth\" = :cropWidth, \"cropHeight\" = :cropHeight "
        + "WHERE \"relatedObjectUuid\" = :relatedObjectUuid").bindBean(entityAvatar).execute();
  }

  /**
   * Deletes the entity avatar in the database
   * 
   * @param relatedObjectUuid the relatedObjectUuid for which to delete the avatar
   * @return number of rows deleted
   */
  @InTransaction
  public int delete(String relatedObjectUuid) {
    return getDbHandle().createUpdate(
        "/* deletEntityAvatar */ DELETE FROM \"entityAvatars\" WHERE \"relatedObjectUuid\" = :relatedObjectUuid")
        .bind("relatedObjectUuid", relatedObjectUuid).execute();
  }
}

package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Map;
import java.util.Optional;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.EntityAvatar;
import mil.dds.anet.beans.Person;
import mil.dds.anet.database.*;
import mil.dds.anet.utils.*;

public class EntityAvatarResource {

  private final EntityAvatarDao entityAvatarDao;

  public EntityAvatarResource(AnetObjectEngine engine) {
    this.entityAvatarDao = engine.getEntityAvatarDao();
  }

  /**
   * Gets the avatar for this entityUUid, null if none existing
   * 
   * @param entityUuid the entityUuid
   * @return the entity avatar
   */
  @GraphQLQuery(name = "entityAvatar")
  public EntityAvatar getEntityAvatar(@GraphQLArgument(name = "entityUuid") String entityUuid) {
    return entityAvatarDao.getByEntityUuid(entityUuid).orElse(null);
  }

  /**
   * Creates or updates an entity avatar
   * 
   * @param context the context
   * @param entityAvatar the entity avatar
   * @return the entity avatar
   */
  @GraphQLMutation(name = "createOrUpdateEntityAvatar")
  public Integer createOrUpdateEntityAvatar(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "entityAvatar") EntityAvatar entityAvatar) {
    int numRows;
    final Person user = DaoUtils.getUserFromContext(context);
    // Do we have an avatar already for this entity?
    Optional<EntityAvatar> dbEntityAvatar =
        entityAvatarDao.getByEntityUuid(entityAvatar.getEntityUuid());
    if (dbEntityAvatar.isEmpty()) {
      numRows = entityAvatarDao.insertInternal(entityAvatar);
      AnetAuditLogger.log("Entity avatar created by {}", user);
    } else {
      numRows = entityAvatarDao.updateInternal(entityAvatar);
      AnetAuditLogger.log("Entity avatar updated by {}", user);
    }
    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  /**
   * Deletes the entity avatar if any
   * 
   * @param context the context
   * @param entityUuid the entityUuid
   * @return the number of rows deleted
   */
  @GraphQLMutation(name = "deleteEntityAvatar")
  public Integer deleteEntityAvatar(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "entityUuid") String entityUuid) {
    final Person user = DaoUtils.getUserFromContext(context);
    int numRows = entityAvatarDao.deleteInternal(entityUuid);
    AnetAuditLogger.log("Entity avatar deleted by {}", user);
    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }
}

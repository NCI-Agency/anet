package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLRootContext;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.EntityAvatar;
import mil.dds.anet.beans.Person;
import mil.dds.anet.database.EntityAvatarDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;

public class EntityAvatarResource {

  private final EntityAvatarDao entityAvatarDao;

  public EntityAvatarResource(AnetObjectEngine engine) {
    this.entityAvatarDao = engine.getEntityAvatarDao();
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
    final int numRows;
    final Person user = DaoUtils.getUserFromContext(context);

    // Check if user is authorized to manipulate avatars for this relatedObjectUuid
    assertPermission(user, entityAvatar.getRelatedObjectType(),
        entityAvatar.getRelatedObjectUuid());

    // Do we have an avatar already for this entity?
    final EntityAvatar dbEntityAvatar =
        entityAvatarDao.getByRelatedObjectUuid(entityAvatar.getRelatedObjectUuid());

    if (dbEntityAvatar == null) {
      numRows = entityAvatarDao.insert(entityAvatar);
      AnetAuditLogger.log("Avatar for entity {} of type {} created by {}",
          entityAvatar.getRelatedObjectUuid(), entityAvatar.getRelatedObjectType(), user);
    } else {
      numRows = entityAvatarDao.update(entityAvatar);
      AnetAuditLogger.log("Avatar for entity {} of type {} updated by {}",
          entityAvatar.getRelatedObjectUuid(), entityAvatar.getRelatedObjectType(), user);
    }

    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  /**
   * Deletes the entity avatar if any
   * 
   * @param context the context
   * @param relatedObjectType the relatedObjectType
   * @param relatedObjectUuid the relatedObjectUuid
   * @return the number of rows deleted
   */
  @GraphQLMutation(name = "deleteEntityAvatar")
  public Integer deleteEntityAvatar(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "relatedObjectType") String relatedObjectType,
      @GraphQLArgument(name = "relatedObjectUuid") String relatedObjectUuid) {
    final Person user = DaoUtils.getUserFromContext(context);

    // Check if user is authorized to manipulate avatars for this relatedObjectUuid
    assertPermission(user, relatedObjectType, relatedObjectUuid);

    int numRows = entityAvatarDao.delete(relatedObjectType, relatedObjectUuid);
    if (numRows > 1) {
      AnetAuditLogger.log("Avatar for entity {} of type {} deleted by {}", relatedObjectUuid,
          relatedObjectType, user);
    }

    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  public static void assertPermission(final Person user, final String relatedObjectType,
      final String relatedObjectUuid) {
    if (!hasPermission(user, relatedObjectType, relatedObjectUuid)) {
      throw new WebApplicationException(AuthUtils.UNAUTH_MESSAGE, Response.Status.FORBIDDEN);
    }
  }

  public static boolean hasPermission(final Person user, final String relatedObjectType,
      final String relatedObjectUuid) {
    if (OrganizationDao.TABLE_NAME.equals(relatedObjectType)) {
      return OrganizationResource.hasPermission(user, relatedObjectUuid);
    }
    return false;
  }
}

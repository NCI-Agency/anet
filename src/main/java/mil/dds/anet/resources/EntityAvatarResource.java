package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import java.util.Map;
import java.util.Optional;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.EntityAvatar;
import mil.dds.anet.beans.Person;
import mil.dds.anet.database.EntityAvatarDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;

public class EntityAvatarResource {

  private final EntityAvatarDao entityAvatarDao;

  public EntityAvatarResource(AnetObjectEngine engine) {
    this.entityAvatarDao = engine.getEntityAvatarDao();
  }

  /**
   * Gets the avatar for this relatedObject uuid, null if none existing
   *
   * @param relatedObjectUuid the relatedObjectUuid
   * @return the entity avatar
   */
  @GraphQLQuery(name = "entityAvatar")
  public EntityAvatar getEntityAvatar(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "relatedObjectUuid") String relatedObjectUuid) {
    return entityAvatarDao.getByRelatedObjectUuid(relatedObjectUuid).orElse(null);
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
    final Optional<EntityAvatar> dbEntityAvatar =
        entityAvatarDao.getByRelatedObjectUuid(entityAvatar.getRelatedObjectUuid());

    if (dbEntityAvatar.isEmpty()) {
      numRows = entityAvatarDao.insert(entityAvatar);
      AnetAuditLogger.log("Entity avatar created by {}", user);
    } else {
      numRows = entityAvatarDao.update(entityAvatar);
      AnetAuditLogger.log("Entity avatar updated by {}", user);
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

    int numRows = entityAvatarDao.delete(relatedObjectUuid);
    if (numRows > 1) {
      AnetAuditLogger.log("Entity avatar deleted by {}", user);
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
    if (relatedObjectType.equals("organizations")) {
      return AuthUtils.isAdmin(user) || AuthUtils.canAdministrateOrg(user, relatedObjectUuid);
    }
    return false;
  }
}

package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLRootContext;
import io.leangen.graphql.spqr.spring.annotations.GraphQLApi;
import mil.dds.anet.beans.EntityAvatar;
import mil.dds.anet.beans.Person;
import mil.dds.anet.database.EntityAvatarDao;
import mil.dds.anet.database.EventDao;
import mil.dds.anet.database.EventSeriesDao;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@GraphQLApi
public class EntityAvatarResource {

  private final EntityAvatarDao entityAvatarDao;

  public EntityAvatarResource(EntityAvatarDao entityAvatarDao) {
    this.entityAvatarDao = entityAvatarDao;
  }

  /**
   * Creates or updates an entity avatar
   *
   * @param context the context
   * @param entityAvatar the entity avatar
   * @return the entity avatar
   */
  @GraphQLMutation(name = "createOrUpdateEntityAvatar")
  public Integer createOrUpdateEntityAvatar(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "entityAvatar") EntityAvatar entityAvatar) {
    final Person user = DaoUtils.getUserFromContext(context);

    // Check if user is authorized to manipulate avatars for this relatedObjectUuid
    assertPermission(user, entityAvatar.getRelatedObjectType(),
        entityAvatar.getRelatedObjectUuid());

    final int numRows = entityAvatarDao.upsert(entityAvatar);
    if (numRows > 0) {
      AnetAuditLogger.log("Avatar for entity {} of type {} created or updated by {}",
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
  public Integer deleteEntityAvatar(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "relatedObjectType") String relatedObjectType,
      @GraphQLArgument(name = "relatedObjectUuid") String relatedObjectUuid) {
    final Person user = DaoUtils.getUserFromContext(context);

    // Check if user is authorized to manipulate avatars for this relatedObjectUuid
    assertPermission(user, relatedObjectType, relatedObjectUuid);

    int numRows = entityAvatarDao.delete(relatedObjectType, relatedObjectUuid);
    if (numRows > 0) {
      AnetAuditLogger.log("Avatar for entity {} of type {} deleted by {}", relatedObjectUuid,
          relatedObjectType, user);
    }

    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  public static void assertPermission(final Person user, final String relatedObjectType,
      final String relatedObjectUuid) {
    if (!hasPermission(user, relatedObjectType, relatedObjectUuid)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, AuthUtils.UNAUTH_MESSAGE);
    }
  }

  public static boolean hasPermission(final Person user, final String relatedObjectType,
      final String relatedObjectUuid) {
    // Check whether the user is allowed to link to the related object!
    return switch (relatedObjectType) {
      case OrganizationDao.TABLE_NAME ->
        OrganizationResource.hasPermission(user, relatedObjectUuid);
      case PersonDao.TABLE_NAME -> PersonResource.hasPermission(user, relatedObjectUuid);
      case EventSeriesDao.TABLE_NAME -> EventSeriesResource.hasPermission(user, relatedObjectUuid);
      case EventDao.TABLE_NAME -> EventResource.hasPermission(user, relatedObjectUuid);
      case LocationDao.TABLE_NAME -> LocationResource.hasPermission(user, relatedObjectUuid);
      // TODO: add other object types if and when entity avatars for them are allowed
      default -> false;
    };
  }
}

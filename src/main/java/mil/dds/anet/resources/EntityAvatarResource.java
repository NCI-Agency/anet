package mil.dds.anet.resources;

import static mil.dds.anet.database.AnetSubscribableObjectDao.getCommonSubscriptionUpdateStatement;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.EntityAvatar;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.RelatableObject;
import mil.dds.anet.database.AuditTrailDao;
import mil.dds.anet.database.EntityAvatarDao;
import mil.dds.anet.database.EventDao;
import mil.dds.anet.database.EventSeriesDao;
import mil.dds.anet.database.LocationDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.PositionDao;
import mil.dds.anet.database.SubscriptionDao;
import mil.dds.anet.database.SubscriptionUpdateGroup;
import mil.dds.anet.database.SubscriptionUpdateStatement;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.views.AbstractAnetBean;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class EntityAvatarResource {

  private final AnetObjectEngine engine;
  private final AuditTrailDao auditTrailDao;
  private final EntityAvatarDao entityAvatarDao;
  private final SubscriptionDao subscriptionDao;

  public EntityAvatarResource(AnetObjectEngine engine, AuditTrailDao auditTrailDao,
      EntityAvatarDao entityAvatarDao, SubscriptionDao subscriptionDao) {
    this.engine = engine;
    this.auditTrailDao = auditTrailDao;
    this.entityAvatarDao = entityAvatarDao;
    this.subscriptionDao = subscriptionDao;
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
      logAndUpdateSubscriptions(entityAvatar, user, "avatar has been set");
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
    final EntityAvatar existing = entityAvatarDao.getByRelatedObjectUuid(relatedObjectUuid);

    // Check if user is authorized to manipulate avatars for this relatedObjectUuid
    assertPermission(user, relatedObjectType, relatedObjectUuid);

    int numRows = entityAvatarDao.delete(relatedObjectType, relatedObjectUuid);
    if (numRows > 0) {
      logAndUpdateSubscriptions(existing, user, "avatar has been deleted");
    }

    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  public void assertPermission(final Person user, final String relatedObjectType,
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
      case PositionDao.TABLE_NAME -> PositionResource.hasPermission(user, relatedObjectUuid);
      // TODO: add other object types if and when entity avatars for them are allowed
      default -> false;
    };
  }

  private void logAndUpdateSubscriptions(EntityAvatar entityAvatar, Person user,
      String updateDescription) {
    // Log the change
    final RelatableObject relatedObject =
        entityAvatar.loadRelatedObject(engine.getContext()).join();
    final Instant now = Instant.now();
    final String auditTrailUuid = auditTrailDao.logUpdate(user, now,
        entityAvatar.getRelatedObjectType(), (AbstractAnetBean) relatedObject, updateDescription);
    // Update any subscriptions
    final SubscriptionUpdateStatement update = getCommonSubscriptionUpdateStatement(true,
        entityAvatar.getRelatedObjectUuid(), entityAvatar.getRelatedObjectType(), "uuid");
    final SubscriptionUpdateGroup subscriptionUpdateGroup =
        new SubscriptionUpdateGroup(entityAvatar.getRelatedObjectType(),
            entityAvatar.getRelatedObjectUuid(), auditTrailUuid, now, update);
    subscriptionDao.updateSubscriptions(subscriptionUpdateGroup, auditTrailUuid);
  }
}

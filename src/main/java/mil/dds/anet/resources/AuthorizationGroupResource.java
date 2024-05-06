package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response.Status;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.database.AuthorizationGroupDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

public class AuthorizationGroupResource {

  private final AuthorizationGroupDao dao;

  public AuthorizationGroupResource(AnetObjectEngine engine) {
    this.dao = engine.getAuthorizationGroupDao();
  }

  @GraphQLQuery(name = "authorizationGroup")
  public AuthorizationGroup getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    final AuthorizationGroup t = dao.getByUuid(uuid);
    if (t == null) {
      throw new WebApplicationException("Authorization group not found", Status.NOT_FOUND);
    }
    return t;
  }

  @GraphQLQuery(name = "authorizationGroupList")
  public AnetBeanList<AuthorizationGroup> search(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") AuthorizationGroupSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(query);
  }

  @GraphQLMutation(name = "createAuthorizationGroup")
  public AuthorizationGroup createAuthorizationGroup(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "authorizationGroup") AuthorizationGroup a) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    if (a.getName() == null || a.getName().trim().isEmpty()) {
      throw new WebApplicationException("Authorization group name must not be empty",
          Status.BAD_REQUEST);
    }
    a = dao.insert(a);

    // Add administrative positions
    dao.addAdministrativePositions(a.getUuid(), a.getAdministrativePositions());

    AnetAuditLogger.log("AuthorizationGroup {} created by {}", a, user);
    return a;
  }

  @GraphQLMutation(name = "updateAuthorizationGroup")
  public Integer updateAuthorizationGroup(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "authorizationGroup") AuthorizationGroup a) {
    final Person user = DaoUtils.getUserFromContext(context);
    final List<Position> existingAdministrativePositions =
        dao.getAdministrativePositionsForAuthorizationGroup(
            AnetObjectEngine.getInstance().getContext(), DaoUtils.getUuid(a)).join();
    // User has to be admin or must hold an administrative position for the authorizationGroup
    if (!AuthUtils.isAdmin(user)) {
      final Position userPosition = DaoUtils.getPosition(user);
      final boolean canUpdate = existingAdministrativePositions.stream()
          .anyMatch(p -> Objects.equals(DaoUtils.getUuid(p), DaoUtils.getUuid(userPosition)));
      if (!canUpdate) {
        throw new WebApplicationException(AuthUtils.UNAUTH_MESSAGE, Status.FORBIDDEN);
      }
    }

    final int numRows = dao.update(a);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process authorization group update",
          Status.NOT_FOUND);
    }

    // Update administrative positions
    if (a.getAdministrativePositions() != null) {
      Utils.addRemoveElementsByUuid(existingAdministrativePositions, a.getAdministrativePositions(),
          newPosition -> dao.addAdministrativePositions(a.getUuid(), List.of(newPosition)),
          oldPosition -> dao.removeAdministrativePositions(a.getUuid(),
              List.of(DaoUtils.getUuid(oldPosition))));
    }

    AnetAuditLogger.log("AuthorizationGroup {} updated by {}", a, user);
    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

}

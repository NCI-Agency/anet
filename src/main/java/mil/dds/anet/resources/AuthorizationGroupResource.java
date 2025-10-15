package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import io.leangen.graphql.spqr.spring.annotations.GraphQLApi;
import java.util.List;
import java.util.Objects;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.AuthorizationGroupDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@GraphQLApi
public class AuthorizationGroupResource {

  private final AuthorizationGroupDao dao;

  public AuthorizationGroupResource(AuthorizationGroupDao dao) {
    this.dao = dao;
  }

  @GraphQLQuery(name = "authorizationGroup")
  public AuthorizationGroup getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    final AuthorizationGroup t = dao.getByUuid(uuid);
    if (t == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Community not found");
    }
    return t;
  }

  @GraphQLQuery(name = "authorizationGroupList")
  public AnetBeanList<AuthorizationGroup> search(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "query") AuthorizationGroupSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(query);
  }

  @GraphQLMutation(name = "createAuthorizationGroup")
  public AuthorizationGroup createAuthorizationGroup(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "authorizationGroup") AuthorizationGroup a) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    if (a.getName() == null || a.getName().trim().isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Community name must not be empty");
    }
    a = dao.insert(a);

    // Add administrative positions
    dao.addAdministrativePositions(a.getUuid(), a.getAdministrativePositions());

    AnetAuditLogger.log("AuthorizationGroup {} created by {}", a, user);
    return a;
  }

  @GraphQLMutation(name = "updateAuthorizationGroup")
  public Integer updateAuthorizationGroup(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "authorizationGroup") AuthorizationGroup a,
      @GraphQLArgument(name = "force", defaultValue = "false") boolean force) {
    final Person user = DaoUtils.getUserFromContext(context);
    final AuthorizationGroup existing = dao.getByUuid(a.getUuid());
    final List<Position> existingAdministrativePositions =
        dao.getAdministrativePositionsForAuthorizationGroup(
            ApplicationContextProvider.getEngine().getContext(), DaoUtils.getUuid(a)).join();
    // User has to be admin or must hold an administrative position for the community
    if (!AuthUtils.isAdmin(user)) {
      final Position userPosition = DaoUtils.getPosition(user);
      final boolean canUpdate = existingAdministrativePositions.stream()
          .anyMatch(p -> Objects.equals(DaoUtils.getUuid(p), DaoUtils.getUuid(userPosition)));
      if (!canUpdate) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, AuthUtils.UNAUTH_MESSAGE);
      }
      // Keep the original the value of forSensitiveInformation, as non-admins are not allowed to
      // change it!
      a.setForSensitiveInformation(existing.getForSensitiveInformation());
    }
    DaoUtils.assertObjectIsFresh(a, existing, force);

    final int numRows = dao.update(a);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process community update");
    }

    // Update administrative positions
    if (a.getAdministrativePositions() != null) {
      Utils.addRemoveElementsByUuid(existingAdministrativePositions, a.getAdministrativePositions(),
          newPosition -> dao.addAdministrativePositions(a.getUuid(), List.of(newPosition)),
          oldPosition -> dao.removeAdministrativePositions(a.getUuid(),
              List.of(DaoUtils.getUuid(oldPosition))));
    }

    // Update any subscriptions
    dao.updateSubscriptions(a);

    AnetAuditLogger.log("AuthorizationGroup {} updated by {}", a, user);
    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

}

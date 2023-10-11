package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Map;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.database.AuthorizationGroupDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;

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
      @GraphQLArgument(name = "authorizationGroup") AuthorizationGroup t) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    if (t.getName() == null || t.getName().trim().isEmpty()) {
      throw new WebApplicationException("Authorization group name must not be empty",
          Status.BAD_REQUEST);
    }
    t = dao.insert(t);
    AnetAuditLogger.log("AuthorizationGroup {} created by {}", t, user);
    return t;
  }

  @GraphQLMutation(name = "updateAuthorizationGroup")
  public Integer updateAuthorizationGroup(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "authorizationGroup") AuthorizationGroup t) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    final int numRows = dao.update(t);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process authorization group update",
          Status.NOT_FOUND);
    }
    AnetAuditLogger.log("AuthorizationGroup {} updated by {}", t, user);
    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

}

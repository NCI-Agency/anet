package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response.Status;
import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.EventSeries;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.EventSeriesSearchQuery;
import mil.dds.anet.database.EventSeriesDao;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

@Path("/api/eventSeries")
public class EventSeriesResource {

  private final EventSeriesDao dao;

  public EventSeriesResource(AnetObjectEngine engine) {
    this.dao = engine.getEventSeriesDao();
  }

  public static void assertPermission(final Person user, final String orgUuid) {
    if (!AuthUtils.canAdministrateOrg(user, orgUuid)) {
      throw new WebApplicationException(AuthUtils.UNAUTH_MESSAGE, Status.FORBIDDEN);
    }
  }

  @GraphQLQuery(name = "eventSeries")
  public EventSeries getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    EventSeries es = dao.getByUuid(uuid);
    if (es == null) {
      throw new WebApplicationException("Event series not found", Status.NOT_FOUND);
    }
    return es;
  }

  @GraphQLQuery(name = "eventSeriesList")
  @AllowUnverifiedUsers
  public AnetBeanList<EventSeries> search(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") EventSeriesSearchQuery query) {
    final Person user = DaoUtils.getUserFromContext(context);
    query.setUser(user);
    return dao.search(query);
  }

  @GraphQLMutation(name = "createEventSeries")
  public EventSeries createEventSeries(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "eventSeries") EventSeries eventSeries) {
    final Person user = DaoUtils.getUserFromContext(context);
    validateEventSeries(user, eventSeries);

    eventSeries.setDescription(Utils.isEmptyHtml(eventSeries.getDescription()) ? null
        : Utils.sanitizeHtml(eventSeries.getDescription()));

    final EventSeries created = dao.insert(eventSeries);

    AnetAuditLogger.log("Event Series {} created by {}", created, user);
    return created;
  }

  @GraphQLMutation(name = "updateEventSeries")
  public Integer updateEventSeries(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "eventSeries") EventSeries eventSeries) {
    final Person user = DaoUtils.getUserFromContext(context);
    validateEventSeries(user, eventSeries);

    eventSeries.setDescription(Utils.isEmptyHtml(eventSeries.getDescription()) ? null
        : Utils.sanitizeHtml(eventSeries.getDescription()));

    final int numRows = dao.update(eventSeries);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process event series update", Status.NOT_FOUND);
    }

    AnetAuditLogger.log("EventSeries {} updated by {}", eventSeries, user);
    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  private void validateEventSeries(final Person user, final EventSeries eventSeries) {
    if (eventSeries.getName() == null || eventSeries.getName().trim().isEmpty()) {
      throw new WebApplicationException("Event Series name must not be empty", Status.BAD_REQUEST);
    }
    if (eventSeries.getDescription() == null || eventSeries.getDescription().trim().isEmpty()) {
      throw new WebApplicationException("Event Series description must not be empty",
          Status.BAD_REQUEST);
    }
    if (eventSeries.getHostOrgUuid() == null || eventSeries.getHostOrgUuid().trim().isEmpty()) {
      throw new WebApplicationException("Event Series Host Organization must not be empty",
          Status.BAD_REQUEST);
    }
    if (eventSeries.getAdminOrgUuid() == null || eventSeries.getAdminOrgUuid().trim().isEmpty()) {
      throw new WebApplicationException("Event Series Admin Organization must not be empty",
          Status.BAD_REQUEST);
    }
    assertPermission(user, eventSeries.getAdminOrgUuid());
  }

}

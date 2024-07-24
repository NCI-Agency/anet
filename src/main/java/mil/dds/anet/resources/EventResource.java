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
import mil.dds.anet.beans.Event;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.EventSearchQuery;
import mil.dds.anet.database.EventDao;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;

@Path("/api/event")
public class EventResource {

  private final EventDao dao;

  public EventResource(AnetObjectEngine engine) {
    this.dao = engine.getEventDao();
  }

  public static void assertPermission(final Person user, final String orgUuid) {
    if (!AuthUtils.canAdministrateOrg(user, orgUuid)) {
      throw new WebApplicationException(AuthUtils.UNAUTH_MESSAGE, Status.FORBIDDEN);
    }
  }

  @GraphQLQuery(name = "event")
  public Event getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    Event es = dao.getByUuid(uuid);
    if (es == null) {
      throw new WebApplicationException("Event not found", Status.NOT_FOUND);
    }
    return es;
  }

  @GraphQLQuery(name = "eventList")
  @AllowUnverifiedUsers
  public AnetBeanList<Event> search(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") EventSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(query);
  }

  @GraphQLMutation(name = "createEvent")
  public Event createEventSeries(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "event") Event event) {
    event.setDescription(Utils.isEmptyHtml(event.getDescription()) ? null
        : Utils.sanitizeHtml(event.getDescription()));
    final Person user = DaoUtils.getUserFromContext(context);
    validateEvent(user, event);

    final Event created = dao.insert(event);

    AnetAuditLogger.log("Event {} created by {}", created, user);
    return created;
  }

  @GraphQLMutation(name = "updateEvent")
  public Integer updateEvent(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "event") Event event) {
    final Person user = DaoUtils.getUserFromContext(context);
    validateEvent(user, event);

    event.setDescription(Utils.isEmptyHtml(event.getDescription()) ? null
        : Utils.sanitizeHtml(event.getDescription()));

    final int numRows = dao.update(event);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process event update", Status.NOT_FOUND);
    }

    AnetAuditLogger.log("Event {} updated by {}", event, user);
    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  private void validateEvent(final Person user, final Event event) {
    if (event.getType() == null || event.getType().trim().isEmpty()) {
      throw new WebApplicationException("Event type must not be empty", Status.BAD_REQUEST);
    }
    if (event.getName() == null || event.getName().trim().isEmpty()) {
      throw new WebApplicationException("Event name must not be empty", Status.BAD_REQUEST);
    }
    if (event.getDescription() == null || event.getDescription().trim().isEmpty()) {
      throw new WebApplicationException("Event description must not be empty", Status.BAD_REQUEST);
    }
    if (event.getStartDate() == null) {
      throw new WebApplicationException("Event start date must not be empty", Status.BAD_REQUEST);
    }
    if (event.getEndDate() == null) {
      throw new WebApplicationException("Event end date must not be empty", Status.BAD_REQUEST);
    }
    if (event.getHostOrgUuid() == null || event.getHostOrgUuid().trim().isEmpty()) {
      throw new WebApplicationException("Event Host Organization must not be empty",
          Status.BAD_REQUEST);
    }
    if (event.getAdminOrgUuid() == null || event.getAdminOrgUuid().trim().isEmpty()) {
      throw new WebApplicationException("Event Admin Organization must not be empty",
          Status.BAD_REQUEST);
    }
    assertPermission(user, event.getAdminOrgUuid());
  }

}

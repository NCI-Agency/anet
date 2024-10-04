package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response.Status;
import java.util.List;
import java.util.Map;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.*;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.EventSearchQuery;
import mil.dds.anet.database.EventDao;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.utils.*;

@Path("/api/event")
public class EventResource {

  private final AnetObjectEngine engine;
  private final EventDao dao;

  public EventResource(AnetObjectEngine engine) {
    this.engine = engine;
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
  public Event createEvent(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "event") Event event) {
    final Person user = DaoUtils.getUserFromContext(context);
    validateEvent(user, event);

    event.setDescription(Utils.isEmptyHtml(event.getDescription()) ? null
        : Utils.sanitizeHtml(event.getDescription()));
    final Event created = dao.insert(event);

    AnetAuditLogger.log("Event {} created by {}", created, user);
    return created;
  }

  @GraphQLMutation(name = "updateEvent")
  public Integer updateEvent(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "event") Event event) {
    final Person user = DaoUtils.getUserFromContext(context);
    validateEvent(user, event);
    // perform all modifications to the event and its tasks in a single transaction,
    return executeEventUpdates(event);
  }

  /**
   * Perform all modifications to the event and its tasks, returning the original state of the
   * event. Should be wrapped in a single transaction to ensure consistency.
   *
   * @param event Event object with the desired modifications
   * @return number of rows of the update
   */
  private Integer executeEventUpdates(Event event) {
    // Verify this person has access to edit this report
    // Either they are an author, or an approver for the current step.
    final Event existing = dao.getByUuid(event.getUuid());
    if (existing == null) {
      throw new WebApplicationException("Event not found", Status.NOT_FOUND);
    }
    event.setDescription(Utils.isEmptyHtml(event.getDescription()) ? null
        : Utils.sanitizeHtml(event.getDescription()));

    // begin DB modifications
    final int numRows = dao.update(event);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process event update", Status.NOT_FOUND);
    }

    // Update Tasks:
    if (event.getTasks() != null) {
      final List<Task> existingTasks =
          dao.getTasksForEvent(engine.getContext(), event.getUuid()).join();
      Utils.addRemoveElementsByUuid(existingTasks, event.getTasks(),
          newTask -> dao.addTaskToEvent(newTask, event),
          oldTask -> dao.removeTaskFromEvent(DaoUtils.getUuid(oldTask), event));
    }

    // Update Organizations:
    if (event.getOrganizations() != null) {
      final List<Organization> existingOrganizations =
          dao.getOrganizationsForEvent(engine.getContext(), event.getUuid()).join();
      Utils.addRemoveElementsByUuid(existingOrganizations, event.getOrganizations(),
          newOrganization -> dao.addOrganizationToEvent(newOrganization, event),
          oldOrganization -> dao.removeOrganizationFromEvent(DaoUtils.getUuid(oldOrganization),
              event));
    }

    // Update People:
    if (event.getPeople() != null) {
      final List<Person> existingPeople =
          dao.getPeopleForEvent(engine.getContext(), event.getUuid()).join();
      Utils.addRemoveElementsByUuid(existingPeople, event.getPeople(),
          newPerson -> dao.addPersonToEvent(newPerson, event),
          oldPerson -> dao.removePersonFromEvent(DaoUtils.getUuid(oldPerson), event));
    }

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

package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Event;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.EventSearchQuery;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.database.EventDao;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class EventResource {

  private final AnetDictionary dict;
  private final AnetObjectEngine engine;
  private final EventDao dao;

  public EventResource(AnetDictionary dict, AnetObjectEngine engine) {
    this.dict = dict;
    this.engine = engine;
    this.dao = engine.getEventDao();
  }

  public static boolean hasPermission(final Person user, final String orgUuid) {
    return AuthUtils.isAdmin(user) || AuthUtils.canAdministrateOrg(user, orgUuid);
  }

  public void assertPermission(final Person user, final String orgUuid) {
    if (!hasPermission(user, orgUuid)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN,
          String.format(
              orgUuid == null ? AuthUtils.MISSING_ORG_MESSAGE : AuthUtils.UNAUTH_ORG_MESSAGE,
              dict.getDictionaryEntry("fields.event.adminOrg.label")));
    }
  }

  @GraphQLQuery(name = "event")
  public Event getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    final Event es = dao.getByUuid(uuid);
    if (es == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found");
    }
    return es;
  }

  @GraphQLQuery(name = "eventList")
  @AllowUnverifiedUsers
  public AnetBeanList<Event> search(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "query") EventSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(query);
  }

  @GraphQLMutation(name = "createEvent")
  public Event createEvent(@GraphQLRootContext GraphQLContext context,
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
  public Integer updateEvent(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "event") Event event,
      @GraphQLArgument(name = "force", defaultValue = "false") boolean force) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Event existing = dao.getByUuid(event.getUuid());
    assertPermission(user, existing.getAdminOrgUuid());
    DaoUtils.assertObjectIsFresh(event, existing, force);

    validateEvent(user, event);

    // perform all modifications to the event and its tasks in a single transaction,
    return executeEventUpdates(user, event);
  }

  /**
   * Perform all modifications to the event and its tasks, returning the original state of the
   * event. Should be wrapped in a single transaction to ensure consistency.
   *
   * @param user The user executing the updates
   * @param event Event object with the desired modifications
   * @return number of rows of the update
   */
  private Integer executeEventUpdates(Person user, Event event) {
    // Verify this person has access to edit this report
    // Either they are an author, or an approver for the current step.
    final Event existing = dao.getByUuid(event.getUuid());
    if (existing == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found");
    }
    event.setDescription(Utils.isEmptyHtml(event.getDescription()) ? null
        : Utils.sanitizeHtml(event.getDescription()));

    // begin DB modifications
    final int numRows = dao.update(event);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process event update");
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

    // Update any subscriptions
    dao.updateSubscriptions(event);

    AnetAuditLogger.log("Event {} updated by {}", event, user);
    return numRows;
  }

  private void validateEvent(final Person user, final Event event) {
    if (event.getStatus() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event status must not be empty");
    }
    if (event.getEventType() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event type must not be empty");
    }
    if (event.getName() == null || event.getName().trim().isEmpty()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event name must not be empty");
    }
    if (event.getStartDate() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Event start date must not be empty");
    }
    if (event.getEndDate() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event end date must not be empty");
    }
    assertPermission(user, event.getAdminOrgUuid());
  }

}

package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;

public class TaskResource {

  private final AnetObjectEngine engine;
  private final TaskDao dao;
  private final String duplicateTaskShortName;

  public TaskResource(AnetObjectEngine engine, AnetConfiguration config) {
    this.engine = engine;
    this.dao = engine.getTaskDao();
    final String taskShortLabel = (String) config.getDictionaryEntry("fields.task.shortLabel");
    duplicateTaskShortName = String.format("Duplicate %s number", taskShortLabel);
  }

  @GraphQLQuery(name = "task")
  public Task getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    Task p = dao.getByUuid(uuid);
    if (p == null) {
      throw new WebApplicationException("Task not found", Status.NOT_FOUND);
    }
    return p;
  }

  @GraphQLMutation(name = "createTask")
  public Task createTask(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "task") Task p) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    try {
      p = dao.insert(p);
      AnetAuditLogger.log("Task {} created by {}", p, user);
      return p;
    } catch (UnableToExecuteStatementException e) {
      throw ResponseUtils.handleSqlException(e, duplicateTaskShortName);
    }
  }

  @GraphQLMutation(name = "updateTask")
  public Integer updateTask(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "task") Task t) {
    Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);

    // Check for loops in the hierarchy
    final Map<String, Task> children =
        AnetObjectEngine.getInstance().buildTopLevelTaskHash(DaoUtils.getUuid(t));
    if (t.getCustomFieldRef1Uuid() != null && children.containsKey(t.getCustomFieldRef1Uuid())) {
      throw new WebApplicationException("Task can not be its own (grand…)parent");
    }

    try {
      final int numRows = dao.update(t);
      if (numRows == 0) {
        throw new WebApplicationException("Couldn't process task update", Status.NOT_FOUND);
      }
      // Update positions:
      if (t.getResponsiblePositions() != null) {
        final List<Position> existingResponsiblePositions =
            dao.getResponsiblePositionsForTask(engine.getContext(), t.getUuid()).join();
        for (final Position p : t.getResponsiblePositions()) {
          Optional<Position> existingPosition = existingResponsiblePositions.stream()
              .filter(el -> el.getUuid().equals(p.getUuid())).findFirst();
          if (existingPosition.isPresent()) {
            existingResponsiblePositions.remove(existingPosition.get());
          } else {
            dao.addPositionToTask(p, t);
          }
        }
        for (final Position p : existingResponsiblePositions) {
          dao.removePositionFromTask(p, t);
        }
      }
      // Update tasked organizations:
      if (t.getTaskedOrganizations() != null) {
        final List<Organization> existingTaskedOrganizations =
            dao.getTaskedOrganizationsForTask(engine.getContext(), t.getUuid()).join();
        for (final Organization org : t.getTaskedOrganizations()) {
          Optional<Organization> existingOrganization = existingTaskedOrganizations.stream()
              .filter(el -> el.getUuid().equals(org.getUuid())).findFirst();
          if (existingOrganization.isPresent()) {
            existingTaskedOrganizations.remove(existingOrganization.get());
          } else {
            dao.addTaskedOrganizationsToTask(org, t);
          }
        }
        for (final Organization org : existingTaskedOrganizations) {
          dao.removeTaskedOrganizationsFromTask(org, t.getUuid());
        }
      }

      AnetAuditLogger.log("Task {} updatedby {}", t, user);
      // GraphQL mutations *have* to return something, so we return the number of updated rows
      return numRows;
    } catch (UnableToExecuteStatementException e) {
      throw ResponseUtils.handleSqlException(e, duplicateTaskShortName);
    }
  }

  @GraphQLQuery(name = "taskList")
  public AnetBeanList<Task> search(@GraphQLArgument(name = "query") TaskSearchQuery query) {
    return dao.search(query);
  }

  /**
   * Returns the most recent Tasks that this user listed in reports.
   * 
   * @param maxResults maximum number of results to return, defaults to 3
   */
  @GraphQLQuery(name = "taskRecents")
  public AnetBeanList<Task> recents(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "maxResults", defaultValue = "3") int maxResults) {
    return new AnetBeanList<Task>(
        dao.getRecentTasks(DaoUtils.getUserFromContext(context), maxResults));
  }
}

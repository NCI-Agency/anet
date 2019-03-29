package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Map;
import java.util.Objects;
import javax.annotation.security.PermitAll;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
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

@PermitAll
public class TaskResource {

  private final TaskDao dao;
  private final String duplicateTaskShortName;

  public TaskResource(AnetObjectEngine engine, AnetConfiguration config) {
    this.dao = engine.getTaskDao();
    final String taskShortLabel = (String) config.getDictionaryEntry("fields.task.shortLabel");
    duplicateTaskShortName = String.format("Duplicate %s number", taskShortLabel);
  }

  @GraphQLQuery(name = "tasks")
  public AnetBeanList<Task> getAll(
      @GraphQLArgument(name = "pageNum", defaultValue = "0") Integer pageNum,
      @GraphQLArgument(name = "pageSize", defaultValue = "100") Integer pageSize) {
    return dao.getAll(pageNum, pageSize);
  }

  @GraphQLQuery(name = "task")
  public Task getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    Task p = dao.getByUuid(uuid);
    if (p == null) {
      throw new WebApplicationException(Status.NOT_FOUND);
    }
    return p;
  }

  @GraphQLMutation(name = "createTask")
  @RolesAllowed("ADMIN")
  public Task createTask(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "task") Task p) {
    Person user = DaoUtils.getUserFromContext(context);
    if (AuthUtils.isAdmin(user) == false) {
      if (p.getResponsibleOrgUuid() == null) {
        throw new WebApplicationException("You must select a responsible organization",
            Status.FORBIDDEN);
      }
      // Admin Users can only create tasks within their organization.
      AuthUtils.assertSuperUserForOrg(user, p.getResponsibleOrgUuid());
    }
    try {
      p = dao.insert(p);
      AnetAuditLogger.log("Task {} created by {}", p, user);
      return p;
    } catch (UnableToExecuteStatementException e) {
      throw ResponseUtils.handleSqlException(e, duplicateTaskShortName);
    }
  }

  @GraphQLMutation(name = "updateTask")
  @RolesAllowed("ADMIN")
  public Integer updateTask(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "task") Task p) {
    Person user = DaoUtils.getUserFromContext(context);
    // Admins can edit all Tasks, SuperUsers can edit tasks within their EF.
    if (AuthUtils.isAdmin(user) == false) {
      Task existing = dao.getByUuid(p.getUuid());
      AuthUtils.assertSuperUserForOrg(user, existing.getResponsibleOrgUuid());

      // If changing the Responsible Organization, Super Users must also have super user privileges
      // over the next org.
      if (!Objects.equals(existing.getResponsibleOrgUuid(), p.getResponsibleOrgUuid())) {
        if (p.getResponsibleOrgUuid() == null) {
          throw new WebApplicationException("You must select a responsible organization",
              Status.FORBIDDEN);
        }
        AuthUtils.assertSuperUserForOrg(user, p.getResponsibleOrgUuid());
      }
    }

    // Check for loops in the hierarchy
    final Map<String, Task> children =
        AnetObjectEngine.getInstance().buildTopLevelTaskHash(DaoUtils.getUuid(p));
    if (p.getCustomFieldRef1Uuid() != null && children.containsKey(p.getCustomFieldRef1Uuid())) {
      throw new WebApplicationException("Task can not be its own (grand…)parent");
    }

    try {
      final int numRows = dao.update(p);
      if (numRows == 0) {
        throw new WebApplicationException("Couldn't process task update", Status.NOT_FOUND);
      }
      AnetAuditLogger.log("Task {} updatedby {}", p, user);
      // GraphQL mutations *have* to return something, so we return the number of updated rows
      return numRows;
    } catch (UnableToExecuteStatementException e) {
      throw ResponseUtils.handleSqlException(e, duplicateTaskShortName);
    }
  }

  @GraphQLQuery(name = "taskList")
  public AnetBeanList<Task> search(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") TaskSearchQuery query) {
    return dao.search(query, DaoUtils.getUserFromContext(context));
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

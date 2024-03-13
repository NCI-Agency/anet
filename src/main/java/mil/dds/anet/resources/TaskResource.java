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
import mil.dds.anet.beans.ApprovalStep;
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
import mil.dds.anet.utils.Utils;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;

public class TaskResource {

  private final AnetObjectEngine engine;
  private final TaskDao dao;
  private final AnetConfiguration config;

  public TaskResource(AnetObjectEngine engine, AnetConfiguration config) {
    this.engine = engine;
    this.dao = engine.getTaskDao();
    this.config = config;
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
      @GraphQLArgument(name = "task") Task t) {
    t.checkAndFixCustomFields();
    t.setDescription(
        Utils.isEmptyHtml(t.getDescription()) ? null : Utils.sanitizeHtml(t.getDescription()));
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    final Task created;
    try {
      created = dao.insert(t);
    } catch (UnableToExecuteStatementException e) {
      throw createDuplicateException(e, t.getShortName(), t.getParentTaskUuid());
    }
    if (t.getPlanningApprovalSteps() != null) {
      // Create the planning approval steps
      for (ApprovalStep step : t.getPlanningApprovalSteps()) {
        Utils.validateApprovalStep(step);
        step.setRelatedObjectUuid(created.getUuid());
        engine.getApprovalStepDao().insertAtEnd(step);
      }
    }
    if (t.getApprovalSteps() != null) {
      // Create the approval steps
      for (ApprovalStep step : t.getApprovalSteps()) {
        Utils.validateApprovalStep(step);
        step.setRelatedObjectUuid(created.getUuid());
        engine.getApprovalStepDao().insertAtEnd(step);
      }
    }

    DaoUtils.saveCustomSensitiveInformation(user, TaskDao.TABLE_NAME, created.getUuid(),
        t.getCustomSensitiveInformation());

    AnetAuditLogger.log("Task {} created by {}", created, user);
    return created;
  }

  @GraphQLMutation(name = "updateTask")
  public Integer updateTask(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "task") Task t) {
    t.checkAndFixCustomFields();
    t.setDescription(
        Utils.isEmptyHtml(t.getDescription()) ? null : Utils.sanitizeHtml(t.getDescription()));
    final Person user = DaoUtils.getUserFromContext(context);
    final List<Position> existingResponsiblePositions =
        dao.getResponsiblePositionsForTask(engine.getContext(), DaoUtils.getUuid(t)).join();
    // User has to be admin or responsible for the task
    if (!AuthUtils.isAdmin(user)) {
      final Position userPosition = DaoUtils.getPosition(user);
      final boolean canUpdate = existingResponsiblePositions.stream()
          .anyMatch(p -> Objects.equals(DaoUtils.getUuid(p), DaoUtils.getUuid(userPosition)));
      if (!canUpdate) {
        throw new WebApplicationException(AuthUtils.UNAUTH_MESSAGE, Status.FORBIDDEN);
      }
    }

    // Check for loops in the hierarchy
    final Map<String, Task> children =
        AnetObjectEngine.getInstance().buildTopLevelTaskHash(DaoUtils.getUuid(t));
    if (t.getParentTaskUuid() != null && children.containsKey(t.getParentTaskUuid())) {
      throw new WebApplicationException("Task can not be its own (grand…)parent");
    }

    try {
      final int numRows = dao.update(t);
      if (numRows == 0) {
        throw new WebApplicationException("Couldn't process task update", Status.NOT_FOUND);
      }
      // Update positions:
      if (t.getResponsiblePositions() != null) {
        Utils.addRemoveElementsByUuid(existingResponsiblePositions, t.getResponsiblePositions(),
            newPos -> dao.addPositionToTask(newPos, t),
            oldPosUuid -> dao.removePositionFromTask(oldPosUuid, t.getUuid()));
      }

      // Update tasked organizations:
      if (t.getTaskedOrganizations() != null) {
        final List<Organization> existingTaskedOrganizations =
            dao.getTaskedOrganizationsForTask(engine.getContext(), t.getUuid()).join();
        Utils.addRemoveElementsByUuid(existingTaskedOrganizations, t.getTaskedOrganizations(),
            newOrg -> dao.addTaskedOrganizationsToTask(newOrg, t),
            oldOrgUuid -> dao.removeTaskedOrganizationsFromTask(oldOrgUuid, t.getUuid()));
      }

      // Load the existing task, so we can check for differences.
      final Task existing = dao.getByUuid(t.getUuid());
      final List<ApprovalStep> existingPlanningApprovalSteps =
          existing.loadPlanningApprovalSteps(engine.getContext()).join();
      final List<ApprovalStep> existingApprovalSteps =
          existing.loadApprovalSteps(engine.getContext()).join();
      Utils.updateApprovalSteps(t, t.getPlanningApprovalSteps(), existingPlanningApprovalSteps,
          t.getApprovalSteps(), existingApprovalSteps);

      DaoUtils.saveCustomSensitiveInformation(user, TaskDao.TABLE_NAME, t.getUuid(),
          t.getCustomSensitiveInformation());

      AnetAuditLogger.log("Task {} updated by {}", t, user);

      // GraphQL mutations *have* to return something, so we return the number of updated rows
      return numRows;
    } catch (UnableToExecuteStatementException e) {
      throw createDuplicateException(e, t.getShortName(), t.getParentTaskUuid());
    }
  }

  @GraphQLQuery(name = "taskList")
  public AnetBeanList<Task> search(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") TaskSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(query);
  }

  private WebApplicationException createDuplicateException(UnableToExecuteStatementException e,
      String shortName, String parentTaskUuid) {
    final String taskShortLabel = (String) config.getDictionaryEntry("fields.task.shortName.label");
    final String msg =
        parentTaskUuid == null ? String.format("Duplicate %s \"%s\"", taskShortLabel, shortName)
            : String.format("Duplicate %s \"%s\" for parent #%s", taskShortLabel, shortName,
                parentTaskUuid);
    return ResponseUtils.handleSqlException(e, msg);
  }
}

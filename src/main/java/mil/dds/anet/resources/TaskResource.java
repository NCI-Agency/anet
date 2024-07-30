package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import io.leangen.graphql.spqr.spring.annotations.GraphQLApi;
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
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;
import mil.dds.anet.utils.Utils;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@GraphQLApi
public class TaskResource {

  private final AnetDictionary dict;
  private final AnetObjectEngine engine;
  private final TaskDao dao;

  public TaskResource(AnetDictionary dict, AnetObjectEngine anetObjectEngine, TaskDao dao) {
    this.dict = dict;
    this.engine = anetObjectEngine;
    this.dao = dao;
  }

  @GraphQLQuery(name = "task")
  public Task getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    Task p = dao.getByUuid(uuid);
    if (p == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found");
    }
    return p;
  }

  @GraphQLMutation(name = "createTask")
  public Task createTask(@GraphQLRootContext GraphQLContext context,
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
  public Integer updateTask(@GraphQLRootContext GraphQLContext context,
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
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, AuthUtils.UNAUTH_MESSAGE);
      }
    }

    // Check for loops in the hierarchy
    if (t.getParentTaskUuid() != null) {
      final Map<String, String> children =
          ApplicationContextProvider.getEngine().buildTopLevelTaskHash(DaoUtils.getUuid(t));
      if (children.containsKey(t.getParentTaskUuid())) {
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
            "Task can not be its own (grand…)parent");
      }
    }

    try {
      final int numRows = dao.update(t);
      if (numRows == 0) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process task update");
      }
      // Update positions:
      if (t.getResponsiblePositions() != null) {
        Utils.addRemoveElementsByUuid(existingResponsiblePositions, t.getResponsiblePositions(),
            newPos -> dao.addPositionToTask(newPos, t),
            oldPos -> dao.removePositionFromTask(DaoUtils.getUuid(oldPos), t.getUuid()));
      }

      // Update tasked organizations:
      if (t.getTaskedOrganizations() != null) {
        final List<Organization> existingTaskedOrganizations =
            dao.getTaskedOrganizationsForTask(engine.getContext(), t.getUuid()).join();
        Utils.addRemoveElementsByUuid(existingTaskedOrganizations, t.getTaskedOrganizations(),
            newOrg -> dao.addTaskedOrganizationsToTask(newOrg, t),
            oldOrg -> dao.removeTaskedOrganizationsFromTask(DaoUtils.getUuid(oldOrg), t.getUuid()));
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
  public AnetBeanList<Task> search(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "query") TaskSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(query);
  }

  private ResponseStatusException createDuplicateException(UnableToExecuteStatementException e,
      String shortName, String parentTaskUuid) {
    final String taskShortLabel = (String) dict.getDictionaryEntry("fields.task.shortName.label");
    final String msg =
        parentTaskUuid == null ? String.format("Duplicate %s \"%s\"", taskShortLabel, shortName)
            : String.format("Duplicate %s \"%s\" for parent #%s", taskShortLabel, shortName,
                parentTaskUuid);
    return ResponseUtils.handleSqlException(e, msg);
  }
}

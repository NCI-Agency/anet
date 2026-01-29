package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.lang.invoke.MethodHandles;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.WithStatus.Status;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.ApprovalStepDao;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;
import mil.dds.anet.utils.Utils;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class TaskResource {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final AnetDictionary dict;
  private final AnetObjectEngine engine;
  private final TaskDao dao;
  private final ApprovalStepDao approvalStepDao;

  public TaskResource(AnetDictionary dict, AnetObjectEngine anetObjectEngine, TaskDao dao,
      ApprovalStepDao approvalStepDao) {
    this.dict = dict;
    this.engine = anetObjectEngine;
    this.dao = dao;
    this.approvalStepDao = approvalStepDao;
  }

  public static boolean hasPermission(final Person user, final String taskUuid) {
    return AuthUtils.isResponsibleForTask(user, taskUuid);
  }

  public static void assertPermission(final Person user, final String taskUuid) {
    if (!hasPermission(user, taskUuid)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, AuthUtils.UNAUTH_MESSAGE);
    }
  }

  public static void assertCreateSubTaskPermission(final Person user, final String parentTaskUuid) {
    if (!AuthUtils.canCreateSubTask(user, parentTaskUuid)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, AuthUtils.UNAUTH_MESSAGE);
    }
  }

  @GraphQLQuery(name = "task")
  public Task getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    Task p = dao.getByUuid(uuid);
    if (p == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found");
    }
    return p;
  }

  @GraphQLQuery(name = "tasks")
  public List<Task> getByUuids(@GraphQLArgument(name = "uuids") List<String> uuids) {
    return dao.getByIds(uuids);
  }

  @GraphQLMutation(name = "createTask")
  public Task createTask(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "task") Task t) {
    t.checkAndFixCustomFields();
    t.setDescription(
        Utils.isEmptyHtml(t.getDescription()) ? null : Utils.sanitizeHtml(t.getDescription()));

    final Person user = DaoUtils.getUserFromContext(context);
    // Check if user is authorized to create a sub task
    assertCreateSubTaskPermission(user, t.getParentTaskUuid());
    // If the task is created by a superuser we need to add their position as a
    // responsible one
    if (user.getPosition().getType() == Position.PositionType.SUPERUSER) {
      t.setResponsiblePositions(List.of(user.getPosition()));
    }

    // If a parent is provided and is INACTIVE, force new task to INACTIVE too
    if (t.getParentTaskUuid() != null) {
      final Task parent = dao.getByUuid(t.getParentTaskUuid());
      if (parent != null && parent.getStatus() == Status.INACTIVE) {
        t.setStatus(Status.INACTIVE);
      }
    }

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
        approvalStepDao.insertAtEnd(step);
      }
    }
    if (t.getApprovalSteps() != null) {
      // Create the approval steps
      for (ApprovalStep step : t.getApprovalSteps()) {
        Utils.validateApprovalStep(step);
        step.setRelatedObjectUuid(created.getUuid());
        approvalStepDao.insertAtEnd(step);
      }
    }

    DaoUtils.saveCustomSensitiveInformation(user, TaskDao.TABLE_NAME, created.getUuid(),
        t.customSensitiveInformationKey(), t.getCustomSensitiveInformation());

    AnetAuditLogger.log("Task {} created by {}", created, user);
    return created;
  }

  private void checkForLoops(String taskUuid, String parentTaskUuid) {
    if (parentTaskUuid != null) {
      final Map<String, String> children =
          ApplicationContextProvider.getEngine().buildTopLevelTaskHash(taskUuid);
      if (children.containsKey(parentTaskUuid)) {
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
            "Task can not be its own (grand…)parent");
      }
    }
  }

  @GraphQLMutation(name = "updateTask")
  public Integer updateTask(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "task") Task t,
      @GraphQLArgument(name = "force", defaultValue = "false") boolean force) {
    t.checkAndFixCustomFields();
    t.setDescription(
        Utils.isEmptyHtml(t.getDescription()) ? null : Utils.sanitizeHtml(t.getDescription()));

    final Person user = DaoUtils.getUserFromContext(context);
    final Task existing = dao.getByUuid(t.getUuid());
    assertPermission(user, DaoUtils.getUuid(t));
    DaoUtils.assertObjectIsFresh(t, existing, force);

    // Check for loops in the hierarchy
    checkForLoops(t.getUuid(), t.getParentTaskUuid());

    if (!AuthUtils.isAdmin(user)
        && !AuthUtils.isSuperUserThatCanEditAllOrganizationsOrTasks(user)) {
      // Check if user holds a responsible position for the task that will be
      // modified with the parent task update
      if (!Objects.equals(t.getParentTaskUuid(), existing.getParentTaskUuid())) {
        if (t.getParentTaskUuid() != null) {
          assertPermission(user, t.getParentTaskUuid());
        }
        if (existing.getParentTaskUuid() != null) {
          assertPermission(user, existing.getParentTaskUuid());
        }
      }
    }

    boolean parentChangedToInactive = false;
    if (t.getParentTaskUuid() != null
        && !t.getParentTaskUuid().equals(existing.getParentTaskUuid())) {
      final Task newParent = dao.getByUuid(t.getParentTaskUuid());
      if (newParent != null && newParent.getStatus() == Status.INACTIVE) {
        // Force current task to INACTIVE if parent is INACTIVE
        t.setStatus(Status.INACTIVE);
        parentChangedToInactive = (existing.getStatus() != Status.INACTIVE);
      }
    }

    try {
      final int numRows = dao.update(t);
      if (numRows == 0) {
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process task update");
      }

      if ((t.getStatus() == Status.INACTIVE && existing.getStatus() != Status.INACTIVE)
          || parentChangedToInactive) {
        final int updatedDescendants = dao.inactivateDescendantTasks(t.getUuid());
        AnetAuditLogger.log("Task {} set to INACTIVE, updated {} descendants", t,
            updatedDescendants);
      }

      // Update positions:
      if (AuthUtils.isAdmin(user) && t.getResponsiblePositions() != null) {
        logger.debug("Editing responsible positions for {}", t);
        final List<Position> existingResponsiblePositions =
            dao.getResponsiblePositionsForTask(engine.getContext(), DaoUtils.getUuid(t)).join();
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

      final List<ApprovalStep> existingPlanningApprovalSteps =
          existing.loadPlanningApprovalSteps(engine.getContext()).join();
      final List<ApprovalStep> existingApprovalSteps =
          existing.loadApprovalSteps(engine.getContext()).join();
      Utils.updateApprovalSteps(t, t.getPlanningApprovalSteps(), existingPlanningApprovalSteps,
          t.getApprovalSteps(), existingApprovalSteps);

      DaoUtils.saveCustomSensitiveInformation(user, TaskDao.TABLE_NAME, t.getUuid(),
          t.customSensitiveInformationKey(), t.getCustomSensitiveInformation());

      // Update any subscriptions
      dao.updateSubscriptions(t);

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

  @GraphQLMutation(name = "mergeTasks")
  public Integer mergeTasks(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "loserUuid") String loserUuid,
      @GraphQLArgument(name = "winnerTask") Task winnerTask) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);

    final var loserTask = dao.getByUuid(loserUuid);
    checkWhetherTasksAreMergeable(winnerTask, loserTask);
    // Check for loops in the hierarchy
    checkForLoops(winnerTask.getUuid(), winnerTask.getParentTaskUuid());
    checkForLoops(loserUuid, winnerTask.getParentTaskUuid());
    final var numberOfAffectedRows = dao.mergeTasks(loserTask, winnerTask);
    if (numberOfAffectedRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Couldn't process merge operation, error occurred while updating merged task relation information.");
    }

    // Update any subscriptions
    dao.updateSubscriptions(winnerTask);

    AnetAuditLogger.log("Task {} merged into {} by {}", loserTask, winnerTask, user);
    return numberOfAffectedRows;
  }

  private void checkWhetherTasksAreMergeable(final Task winnerTask, final Task loserTask) {
    if (Objects.equals(DaoUtils.getUuid(loserTask), DaoUtils.getUuid(winnerTask))) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot merge identical tasks.");
    }
  }
}

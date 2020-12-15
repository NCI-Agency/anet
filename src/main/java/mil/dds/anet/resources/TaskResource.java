package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
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
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    final Task created;
    try {
      created = dao.insert(t);
    } catch (UnableToExecuteStatementException e) {
      throw createDuplicateException(e);
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
    AnetAuditLogger.log("Task {} created by {}", t, user);
    return created;
  }

  @GraphQLMutation(name = "updateTask")
  public Integer updateTask(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "task") Task t) {
    t.checkAndFixCustomFields();
    final Person user = DaoUtils.getUserFromContext(context);
    final List<Position> existingResponsiblePositions =
        dao.getResponsiblePositionsForTask(engine.getContext(), DaoUtils.getUuid(t)).join();
    // User has to be admin or responsible for the task
    if (!AuthUtils.isAdmin(user)) {
      final Position userPosition = user.loadPosition();
      final boolean canUpdate = existingResponsiblePositions.stream()
          .anyMatch(p -> Objects.equals(DaoUtils.getUuid(p), DaoUtils.getUuid(userPosition)));
      if (!canUpdate) {
        throw new WebApplicationException(AuthUtils.UNAUTH_MESSAGE, Status.FORBIDDEN);
      }
    }

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

      // Load the existing task, so we can check for differences.
      final Task existing = dao.getByUuid(t.getUuid());
      final List<ApprovalStep> existingPlanningApprovalSteps =
          existing.loadPlanningApprovalSteps(engine.getContext()).join();
      final List<ApprovalStep> existingApprovalSteps =
          existing.loadApprovalSteps(engine.getContext()).join();
      Utils.updateApprovalSteps(t, t.getPlanningApprovalSteps(), existingPlanningApprovalSteps,
          t.getApprovalSteps(), existingApprovalSteps);
      AnetAuditLogger.log("Task {} updatedby {}", t, user);

      // GraphQL mutations *have* to return something, so we return the number of updated rows
      return numRows;
    } catch (UnableToExecuteStatementException e) {
      throw createDuplicateException(e);
    }
  }

  @GraphQLQuery(name = "taskList")
  public AnetBeanList<Task> search(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") TaskSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(query);
  }

  private WebApplicationException createDuplicateException(UnableToExecuteStatementException e) {
    final String taskShortLabel = (String) config.getDictionaryEntry("fields.task.shortLabel");
    return ResponseUtils.handleSqlException(e,
        String.format("Duplicate %s number", taskShortLabel));
  }

  @GraphQLMutation(name = "mergeTask")
  public Task mergeTask(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "loserUuid") String loserUuid,
      @GraphQLArgument(name = "winnerTask") Task winnerTask) {
    final Person user = DaoUtils.getUserFromContext(context);
    final Task loser = dao.getByUuid(loserUuid);
    final Task winnerBeforeUpdate = dao.getByUuid(winnerTask.getUuid());

    final Map<String, Task> children =
        AnetObjectEngine.getInstance().buildTopLevelTaskHash(DaoUtils.getUuid(winnerTask));
    if (winnerTask.getCustomFieldRef1Uuid() != null
        && children.containsKey(winnerTask.getCustomFieldRef1Uuid())) {
      throw new WebApplicationException("Task can not be its own (grand…)parent");
    }
    final List<Position> existingResponsiblePositions = dao
        .getResponsiblePositionsForTask(engine.getContext(), DaoUtils.getUuid(winnerTask)).join();
    final List<Position> looserTaskResponsiblePositions =
        dao.getResponsiblePositionsForTask(engine.getContext(), DaoUtils.getUuid(loser)).join();
    try {
      final int numRows = dao.update(winnerTask);
      if (numRows == 0) {
        throw new WebApplicationException("Couldn't process task update", Status.NOT_FOUND);
      }

      // Update positions:
      if (winnerTask.getResponsiblePositions() != null) {
        for (final Position p : winnerTask.getResponsiblePositions()) {
          Optional<Position> existingPosition = existingResponsiblePositions.stream()
              .filter(el -> el.getUuid().equals(p.getUuid())).findFirst();
          if (existingPosition.isPresent()) {
            existingResponsiblePositions.remove(existingPosition.get());
          } else {
            dao.addPositionToTask(p, winnerTask);
          }
        }
        for (final Position p : existingResponsiblePositions) {
          dao.removePositionFromTask(p, winnerTask);
        }
        for (final Position p : looserTaskResponsiblePositions) {
          dao.removePositionFromTask(p, loser);
        }
      }

      // Update tasked organizations:
      if (winnerTask.getTaskedOrganizations() != null) {
        final List<Organization> existingTaskedOrganizations =
            dao.getTaskedOrganizationsForTask(engine.getContext(), winnerTask.getUuid()).join();
        final List<Organization> loserTaskTaskedOrganizations =
            dao.getTaskedOrganizationsForTask(engine.getContext(), loser.getUuid()).join();
        for (final Organization org : winnerTask.getTaskedOrganizations()) {
          Optional<Organization> existingOrganization = existingTaskedOrganizations.stream()
              .filter(el -> el.getUuid().equals(org.getUuid())).findFirst();
          if (existingOrganization.isPresent()) {
            existingTaskedOrganizations.remove(existingOrganization.get());
          } else {
            dao.addTaskedOrganizationsToTask(org, winnerTask);
          }
        }
        for (final Organization org : existingTaskedOrganizations) {
          dao.removeTaskedOrganizationsFromTask(org, winnerTask.getUuid());
        }
        for (final Organization org : loserTaskTaskedOrganizations) {
          dao.removeTaskedOrganizationsFromTask(org, loser.getUuid());
        }
      }

      // Update approval steps.
      final List<ApprovalStep> existingPlanningApprovalSteps =
          loser.loadPlanningApprovalSteps(engine.getContext()).join();
      final List<ApprovalStep> existing2PlanningApprovalSteps =
          winnerBeforeUpdate.loadPlanningApprovalSteps(engine.getContext()).join();
      existingPlanningApprovalSteps.addAll(existing2PlanningApprovalSteps);
      final List<ApprovalStep> existingApprovalSteps =
          loser.loadApprovalSteps(engine.getContext()).join();
      final List<ApprovalStep> existingApprovalSteps2 =
          winnerBeforeUpdate.loadApprovalSteps(engine.getContext()).join();
      existingApprovalSteps.addAll(existingApprovalSteps2);
      Utils.updateApprovalSteps(winnerTask, winnerTask.getPlanningApprovalSteps(),
          existingPlanningApprovalSteps, winnerTask.getApprovalSteps(), existingApprovalSteps);

      int mergedRows = dao.mergeTask(loser, winnerTask);
      if (mergedRows == 0) {
        throw new WebApplicationException("Couldn't process task merge", Status.NOT_FOUND);
      }
      AnetAuditLogger.log("Task {} merged with {} by {}", loser, winnerTask, user);

    } catch (UnableToExecuteStatementException e) {
      throw createDuplicateException(e);
    }
    return winnerTask;
  }
}

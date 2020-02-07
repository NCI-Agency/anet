package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.lang.invoke.MethodHandles;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;
import mil.dds.anet.utils.Utils;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class OrganizationResource {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final OrganizationDao dao;
  private final AnetObjectEngine engine;

  public OrganizationResource(AnetObjectEngine engine) {
    this.dao = engine.getOrganizationDao();
    this.engine = engine;
  }

  @GraphQLQuery(name = "organizationTopLevelOrgs")
  public AnetBeanList<Organization> getTopLevelOrgs(
      @GraphQLArgument(name = "type") OrganizationType type) {
    return new AnetBeanList<Organization>(dao.getTopLevelOrgs(type));
  }

  @GraphQLQuery(name = "organization")
  public Organization getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    Organization org = dao.getByUuid(uuid);
    if (org == null) {
      throw new WebApplicationException("Organization not found", Status.NOT_FOUND);
    }
    return org;
  }

  @GraphQLMutation(name = "createOrganization")
  public Organization createOrganization(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "organization") Organization org) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);
    final Organization created;
    try {
      created = dao.insert(org);
    } catch (UnableToExecuteStatementException e) {
      throw ResponseUtils.handleSqlException(e, "Duplicate identification code");
    }

    if (org.getTasks() != null) {
      // Assign all of these tasks to this organization.
      for (Task task : org.getTasks()) {
        engine.getTaskDao().addTaskedOrganizationsToTask(org, task);
      }
    }
    if (org.getPlanningApprovalSteps() != null) {
      // Create the planning approval steps
      for (ApprovalStep step : org.getPlanningApprovalSteps()) {
        Utils.validateApprovalStep(step);
        step.setRelatedObjectUuid(created.getUuid());
        engine.getApprovalStepDao().insertAtEnd(step);
      }
    }
    if (org.getApprovalSteps() != null) {
      // Create the approval steps
      for (ApprovalStep step : org.getApprovalSteps()) {
        Utils.validateApprovalStep(step);
        step.setRelatedObjectUuid(created.getUuid());
        engine.getApprovalStepDao().insertAtEnd(step);
      }
    }
    AnetAuditLogger.log("Organization {} created by {}", created, user);
    return created;
  }



  @GraphQLMutation(name = "updateOrganization")
  public Integer updateOrganization(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "organization") Organization org)
      throws InterruptedException, ExecutionException, Exception {
    final Person user = DaoUtils.getUserFromContext(context);
    // Verify correct Organization
    AuthUtils.assertSuperUserForOrg(user, DaoUtils.getUuid(org), false);

    // Check for loops in the hierarchy
    final Map<String, Organization> children =
        AnetObjectEngine.getInstance().buildTopLevelOrgHash(DaoUtils.getUuid(org));
    if (org.getParentOrgUuid() != null && children.containsKey(org.getParentOrgUuid())) {
      throw new WebApplicationException("Organization can not be its own (grand…)parent");
    }

    // Load the existing org, so we can check for differences.
    final Organization existing = dao.getByUuid(org.getUuid());
    final int numRows = AuthUtils.isAdmin(user) ? doAdminUpdates(org, existing) : 1;
    doSuperUserUpdates(org, existing);

    AnetAuditLogger.log("Organization {} updated by {}", org, user);
    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  private int doAdminUpdates(Organization org, Organization existing) {
    final int numRows;
    try {
      numRows = dao.update(org);
    } catch (UnableToExecuteStatementException e) {
      throw ResponseUtils.handleSqlException(e, "Duplicate identification code");
    }

    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process organization update", Status.NOT_FOUND);
    }

    if (org.getTasks() != null) {
      logger.debug("Editing tasks for {}", org);
      Utils.addRemoveElementsByUuid(existing.loadTasks(engine.getContext()).join(), org.getTasks(),
          newTask -> engine.getTaskDao().addTaskedOrganizationsToTask(org, newTask),
          oldTaskUuid -> engine.getTaskDao().removeTaskedOrganizationsFromTask(org, oldTaskUuid));
    }

    return numRows;
  }

  private void doSuperUserUpdates(Organization org, Organization existing) {
    if (org.getPlanningApprovalSteps() != null) {
      logger.debug("Editing planning approval steps for {}", org);
      for (ApprovalStep step : org.getPlanningApprovalSteps()) {
        Utils.validateApprovalStep(step);
        step.setRelatedObjectUuid(org.getUuid());
      }
      List<ApprovalStep> existingSteps =
          existing.loadPlanningApprovalSteps(engine.getContext()).join();

      Utils.addRemoveElementsByUuid(existingSteps, org.getPlanningApprovalSteps(),
          newStep -> engine.getApprovalStepDao().insert(newStep),
          oldStepUuid -> engine.getApprovalStepDao().delete(oldStepUuid));

      Utils.updateSteps(org.getPlanningApprovalSteps(), existingSteps);
    }
    if (org.getApprovalSteps() != null) {
      logger.debug("Editing approval steps for {}", org);
      for (ApprovalStep step : org.getApprovalSteps()) {
        Utils.validateApprovalStep(step);
        step.setRelatedObjectUuid(org.getUuid());
      }
      List<ApprovalStep> existingSteps = existing.loadApprovalSteps(engine.getContext()).join();

      Utils.addRemoveElementsByUuid(existingSteps, org.getApprovalSteps(),
          newStep -> engine.getApprovalStepDao().insert(newStep),
          oldStepUuid -> engine.getApprovalStepDao().delete(oldStepUuid));

      Utils.updateSteps(org.getApprovalSteps(), existingSteps);
    }
  }

  @GraphQLQuery(name = "organizationList")
  public AnetBeanList<Organization> search(
      @GraphQLArgument(name = "query") OrganizationSearchQuery query) {
    return dao.search(query);
  }

  @GraphQLQuery(name = "approvalStepInUse")
  public boolean isApprovalStepInUse(@GraphQLArgument(name = "uuid") String uuid) {
    return engine.getApprovalStepDao().isStepInUse(uuid);
  }
}

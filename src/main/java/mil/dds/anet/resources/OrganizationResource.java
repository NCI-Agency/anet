package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.lang.invoke.MethodHandles;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Organization;
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
    org.checkAndFixCustomFields();
    final Person user = DaoUtils.getUserFromContext(context);
    // Check if user is authorized to create a sub organization
    if (!AuthUtils.isAdmin(user)) {
      AuthUtils.assertCanAdministrateOrg(user, org.getParentOrgUuid(), false);
    }
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

    DaoUtils.saveCustomSensitiveInformation(user, OrganizationDao.TABLE_NAME, created.getUuid(),
        org.getCustomSensitiveInformation());

    AnetAuditLogger.log("Organization {} created by {}", created, user);
    return created;
  }



  @GraphQLMutation(name = "updateOrganization")
  public Integer updateOrganization(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "organization") Organization org) {
    org.checkAndFixCustomFields();
    final Person user = DaoUtils.getUserFromContext(context);
    // Verify correct Organization
    AuthUtils.assertCanAdministrateOrg(user, DaoUtils.getUuid(org), false);

    // Load the existing organization, so we can check for differences.
    final Organization existing = dao.getByUuid(org.getUuid());

    // Check for loops in the hierarchy
    final Map<String, Organization> children =
        AnetObjectEngine.getInstance().buildTopLevelOrgHash(DaoUtils.getUuid(org));
    if (org.getParentOrgUuid() != null && children.containsKey(org.getParentOrgUuid())) {
      throw new WebApplicationException("Organization can not be its own (grand…)parent");
    }

    if (!AuthUtils.isAdmin(user)) {
      // Check if user has administrative permission for the organizations that will be
      // modified with the parent organization update
      if (!Objects.equals(org.getParentOrgUuid(), existing.getParentOrgUuid())) {
        if (org.getParentOrgUuid() != null) {
          final Organization parentOrg = dao.getByUuid(org.getParentOrgUuid());
          if (parentOrg.getType() != org.getType()) {
            throw new WebApplicationException(
                "You cannot assign a different type of organization as the parent",
                Status.FORBIDDEN);
          }
          AuthUtils.assertCanAdministrateOrg(user, org.getParentOrgUuid(), false);
        }
        if (existing.getParentOrgUuid() != null) {
          AuthUtils.assertCanAdministrateOrg(user, existing.getParentOrgUuid(), false);
        }
      }
      // User is not authorized to change the organization type
      if (org.getType() != existing.getType()) {
        throw new WebApplicationException(
            "You do not have permissions to change the type of this organization",
            Status.FORBIDDEN);
      }
    }

    final int numRows = update(user, org, existing);

    DaoUtils.saveCustomSensitiveInformation(user, OrganizationDao.TABLE_NAME, org.getUuid(),
        org.getCustomSensitiveInformation());

    AnetAuditLogger.log("Organization {} updated by {}", org, user);

    // GraphQL mutations *have* to return something, so we return the number of updated rows
    return numRows;
  }

  private int update(Person user, Organization org, Organization existing) {
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

    if (AuthUtils.isAdmin(user) && org.getAdministratingPositions() != null) {
      logger.debug("Editing administrating positions for {}", org);
      Utils.addRemoveElementsByUuid(
          existing.loadAdministratingPositions(engine.getContext()).join(),
          org.getAdministratingPositions(),
          newPosition -> dao.addPositionToOrganization(newPosition, org),
          oldPositionUuid -> dao.removePositionFromOrganization(oldPositionUuid, org));
    }

    final List<ApprovalStep> existingPlanningApprovalSteps =
        existing.loadPlanningApprovalSteps(engine.getContext()).join();
    final List<ApprovalStep> existingApprovalSteps =
        existing.loadApprovalSteps(engine.getContext()).join();
    Utils.updateApprovalSteps(org, org.getPlanningApprovalSteps(), existingPlanningApprovalSteps,
        org.getApprovalSteps(), existingApprovalSteps);

    return numRows;
  }

  @GraphQLQuery(name = "organizationList")
  public AnetBeanList<Organization> search(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") OrganizationSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(query);
  }

}

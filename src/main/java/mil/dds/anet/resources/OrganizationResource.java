package mil.dds.anet.resources;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response.Status;
import java.lang.invoke.MethodHandles;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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

  public static boolean hasPermission(final Person user, final String organizationUuid) {
    return AuthUtils.isAdmin(user) || AuthUtils.canAdministrateOrg(user, organizationUuid);
  }

  public static void assertPermission(final Person user, final String organizationUuid) {
    if (!hasPermission(user, organizationUuid)) {
      throw new WebApplicationException(AuthUtils.UNAUTH_MESSAGE, Status.FORBIDDEN);
    }
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
    org.setProfile(
        Utils.isEmptyHtml(org.getProfile()) ? null : Utils.sanitizeHtml(org.getProfile()));

    final Person user = DaoUtils.getUserFromContext(context);
    // Check if user is authorized to create a sub organization
    assertPermission(user, org.getParentOrgUuid());
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

    engine.getEmailAddressDao().updateEmailAddresses(OrganizationDao.TABLE_NAME, created.getUuid(),
        org.getEmailAddresses());

    DaoUtils.saveCustomSensitiveInformation(user, OrganizationDao.TABLE_NAME, created.getUuid(),
        org.getCustomSensitiveInformation());

    AnetAuditLogger.log("Organization {} created by {}", created, user);
    return created;
  }



  @GraphQLMutation(name = "updateOrganization")
  public Integer updateOrganization(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "organization") Organization org) {
    org.checkAndFixCustomFields();
    org.setProfile(
        Utils.isEmptyHtml(org.getProfile()) ? null : Utils.sanitizeHtml(org.getProfile()));

    final Person user = DaoUtils.getUserFromContext(context);
    // Verify correct Organization
    assertPermission(user, DaoUtils.getUuid(org));

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
          assertPermission(user, org.getParentOrgUuid());
        }
        if (existing.getParentOrgUuid() != null) {
          assertPermission(user, existing.getParentOrgUuid());
        }
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
      final List<Task> existingTasks = existing.loadTasks(engine.getContext()).join();
      Utils.addRemoveElementsByUuid(existingTasks, org.getTasks(),
          newTask -> engine.getTaskDao().addTaskedOrganizationsToTask(org, newTask),
          oldTaskUuid -> engine.getTaskDao().removeTaskedOrganizationsFromTask(org.getUuid(),
              oldTaskUuid));
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

    engine.getEmailAddressDao().updateEmailAddresses(OrganizationDao.TABLE_NAME, org.getUuid(),
        org.getEmailAddresses());

    return numRows;
  }

  @GraphQLQuery(name = "organizationList")
  public AnetBeanList<Organization> search(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") OrganizationSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(query);
  }

}

package mil.dds.anet.resources;

import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import io.leangen.graphql.spqr.spring.annotations.GraphQLApi;
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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@GraphQLApi
public class OrganizationResource {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final AnetObjectEngine engine;
  private final OrganizationDao dao;

  public OrganizationResource(AnetObjectEngine anetObjectEngine, OrganizationDao dao) {
    this.engine = anetObjectEngine;
    this.dao = dao;
  }

  public static boolean hasPermission(final Person user, final String organizationUuid) {
    return AuthUtils.canAdministrateOrg(user, organizationUuid);
  }

  public static boolean hasPermission(final Person user, final Organization organization) {
    return hasPermission(user, organization.getUuid());
  }

  public void assertPermission(final Person user, final String organizationUuid) {
    if (!hasPermission(user, organizationUuid)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, AuthUtils.UNAUTH_MESSAGE);
    }
  }

  public static void assertCreateSubOrganizationPermission(final Person user,
      final String parentOrganizationUuid) {
    if (!AuthUtils.canCreateSubOrg(user, parentOrganizationUuid)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, AuthUtils.UNAUTH_MESSAGE);
    }
  }

  @GraphQLQuery(name = "organization")
  public Organization getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    Organization org = dao.getByUuid(uuid);
    if (org == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Organization not found");
    }
    return org;
  }

  @GraphQLQuery(name = "organizations")
  public List<Organization> getByUuids(@GraphQLArgument(name = "uuids") List<String> uuids) {
    return dao.getByIds(uuids);
  }

  @GraphQLMutation(name = "createOrganization")
  public Organization createOrganization(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "organization") Organization org) {
    org.checkAndFixCustomFields();
    org.setProfile(
        Utils.isEmptyHtml(org.getProfile()) ? null : Utils.sanitizeHtml(org.getProfile()));

    final Person user = DaoUtils.getUserFromContext(context);
    // Check if user is authorized to create a sub organization
    assertCreateSubOrganizationPermission(user, org.getParentOrgUuid());
    // If the organization is created by a superuser we need to add their position as an
    // administrating one
    if (user.getPosition().getType() == Position.PositionType.SUPERUSER) {
      org.setAdministratingPositions(List.of(user.getPosition()));
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

    engine.getEmailAddressDao().updateEmailAddresses(OrganizationDao.TABLE_NAME, created.getUuid(),
        org.getEmailAddresses());

    DaoUtils.saveCustomSensitiveInformation(user, OrganizationDao.TABLE_NAME, created.getUuid(),
        org.getCustomSensitiveInformation());

    AnetAuditLogger.log("Organization {} created by {}", created, user);
    return created;
  }

  @GraphQLMutation(name = "updateOrganization")
  public Integer updateOrganization(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "organization") Organization org) {
    org.checkAndFixCustomFields();
    org.setProfile(
        Utils.isEmptyHtml(org.getProfile()) ? null : Utils.sanitizeHtml(org.getProfile()));

    final Person user = DaoUtils.getUserFromContext(context);
    // Verify correct Organization
    assertPermission(user, org.getUuid());
    // Check for loops in the hierarchy
    checkForLoops(org.getUuid(), org.getParentOrgUuid());

    // Load the existing organization, so we can check for differences.
    final Organization existing = dao.getByUuid(org.getUuid());

    if (!AuthUtils.isAdmin(user)
        && !AuthUtils.isSuperUserThatCanEditAllOrganizationsOrTasks(user)) {
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

  private void checkForLoops(String orgUuid, String parentOrgUuid) {
    if (parentOrgUuid != null) {
      final Map<String, String> children = engine.buildTopLevelOrgHash(orgUuid);
      if (children.containsKey(parentOrgUuid)) {
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
            "Organization can not be its own (grand…)parent");
      }
    }
  }

  private int update(Person user, Organization org, Organization existing) {
    final int numRows;
    try {
      numRows = dao.update(org);
    } catch (UnableToExecuteStatementException e) {
      throw ResponseUtils.handleSqlException(e, "Duplicate identification code");
    }

    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Couldn't process organization update");
    }

    if (org.getTasks() != null) {
      logger.debug("Editing tasks for {}", org);
      final List<Task> existingTasks = existing.loadTasks(engine.getContext()).join();
      Utils.addRemoveElementsByUuid(existingTasks, org.getTasks(),
          newTask -> engine.getTaskDao().addTaskedOrganizationsToTask(org, newTask),
          oldTask -> engine.getTaskDao().removeTaskedOrganizationsFromTask(org.getUuid(),
              DaoUtils.getUuid(oldTask)));
    }

    if (AuthUtils.isAdmin(user) && org.getAdministratingPositions() != null) {
      logger.debug("Editing administrating positions for {}", org);
      Utils.addRemoveElementsByUuid(
          existing.loadAdministratingPositions(engine.getContext()).join(),
          org.getAdministratingPositions(),
          newPosition -> dao.addPositionToOrganization(newPosition, org),
          oldPosition -> dao.removePositionFromOrganization(DaoUtils.getUuid(oldPosition), org));
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
  public AnetBeanList<Organization> search(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "query") OrganizationSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(query);
  }

  @GraphQLMutation(name = "mergeOrganizations")
  public Integer mergeOrganizations(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "loserUuid") String loserUuid,
      @GraphQLArgument(name = "winnerOrganization") Organization winnerOrganization) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(user);

    final var loserOrganization = dao.getByUuid(loserUuid);
    checkWhetherOrganizationsAreMergeable(winnerOrganization, loserOrganization);
    // Check for loops in the hierarchy
    checkForLoops(winnerOrganization.getUuid(), winnerOrganization.getParentOrgUuid());
    checkForLoops(loserUuid, winnerOrganization.getParentOrgUuid());
    final var numberOfAffectedRows = dao.mergeOrganizations(loserOrganization, winnerOrganization);
    if (numberOfAffectedRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Couldn't process merge operation, error occurred while updating merged organization relation information.");
    }
    AnetAuditLogger.log("Organization {} merged into {} by {}", loserOrganization,
        winnerOrganization, user);
    return numberOfAffectedRows;
  }

  private void checkWhetherOrganizationsAreMergeable(final Organization winnerOrganization,
      final Organization loserOrganization) {
    if (Objects.equals(DaoUtils.getUuid(loserOrganization), DaoUtils.getUuid(winnerOrganization))) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Cannot merge identical organizations.");
    }
  }

}

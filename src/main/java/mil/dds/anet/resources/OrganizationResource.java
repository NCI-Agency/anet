package mil.dds.anet.resources;

import java.lang.invoke.MethodHandles;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ExecutionException;

import javax.annotation.security.PermitAll;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;

import org.jdbi.v3.core.statement.UnableToExecuteStatementException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.database.ApprovalStepDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;
import mil.dds.anet.utils.Utils;

@PermitAll
public class OrganizationResource {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	private final OrganizationDao dao;
	private final AnetObjectEngine engine;
	
	public OrganizationResource(AnetObjectEngine engine) {
		this.dao = engine.getOrganizationDao(); 
		this.engine = engine;
	}

	@GraphQLQuery(name="organizations")
	public AnetBeanList<Organization> getAll(@GraphQLArgument(name="pageNum", defaultValue="0") Integer pageNum,
			@GraphQLArgument(name="pageSize", defaultValue="100") Integer pageSize) {
		return dao.getAll(pageNum, pageSize);
	} 

	@GraphQLQuery(name="organizationTopLevelOrgs")
	public AnetBeanList<Organization> getTopLevelOrgs(@GraphQLArgument(name="type") OrganizationType type) {
		return new AnetBeanList<Organization>(dao.getTopLevelOrgs(type));
	}

	@GraphQLQuery(name="organization")
	public Organization getByUuid(@GraphQLArgument(name="uuid") String uuid) {
		Organization org = dao.getByUuid(uuid);
		if (org == null) { throw new WebApplicationException(Status.NOT_FOUND); }
		return org;
	}

	@GraphQLMutation(name="createOrganization")
	@RolesAllowed("ADMINISTRATOR")
	public Organization createOrganization(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="organization") Organization org) {
		Person user = DaoUtils.getUserFromContext(context);
		AuthUtils.assertAdministrator(user);
		final Organization created;
		try {
			created = dao.insert(org);
		} catch (UnableToExecuteStatementException e) {
			throw ResponseUtils.handleSqlException(e, "Duplicate identification code");
		}

		if (org.getTasks() != null) {
			//Assign all of these tasks to this organization.
			for (Task p : org.getTasks()) {
				engine.getTaskDao().setResponsibleOrgForTask(DaoUtils.getUuid(p), DaoUtils.getUuid(created));
			}
		}
		if (org.getApprovalSteps() != null) {
			//Create the approval steps
			for (ApprovalStep step : org.getApprovalSteps()) {
				validateApprovalStep(step);
				step.setAdvisorOrganizationUuid(created.getUuid());
				engine.getApprovalStepDao().insertAtEnd(step);
			}
		}
		AnetAuditLogger.log("Organization {} created by {}", created, user);
		return created;
	}

	//Helper method that diffs the name/members of an approvalStep
	private void updateStep(ApprovalStep newStep, ApprovalStep oldStep) {
		final AnetObjectEngine engine = AnetObjectEngine.getInstance();
		final ApprovalStepDao approvalStepDao = engine.getApprovalStepDao();
		newStep.setUuid(oldStep.getUuid()); //Always want to make changes to the existing group
		if (!newStep.getName().equals(oldStep.getName())) {
			approvalStepDao.update(newStep);
		} else if (!Objects.equals(newStep.getNextStepUuid(), oldStep.getNextStepUuid())) {
			approvalStepDao.update(newStep);
		}

		if (newStep.getApprovers() != null) {
			try {
				Utils.addRemoveElementsByUuid(oldStep.loadApprovers(engine.getContext()).get(), newStep.getApprovers(),
					newPosition -> approvalStepDao.addApprover(newStep, DaoUtils.getUuid(newPosition)),
					oldPositionUuid -> approvalStepDao.removeApprover(newStep, oldPositionUuid));
			} catch (InterruptedException | ExecutionException e) {
				throw new WebApplicationException("failed to load Approvers", e);
			}
		}
	}

	@GraphQLMutation(name="updateOrganization")
	@RolesAllowed("SUPER_USER")
	public Integer updateOrganization(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="organization") Organization org)
			throws InterruptedException, ExecutionException, Exception {
		Person user = DaoUtils.getUserFromContext(context);
		//Verify correct Organization
		AuthUtils.assertSuperUserForOrg(user, DaoUtils.getUuid(org));

		// Check for loops in the hierarchy
		final Map<String, Organization> children = AnetObjectEngine.getInstance().buildTopLevelOrgHash(DaoUtils.getUuid(org));
		if (org.getParentOrgUuid() != null && children.containsKey(org.getParentOrgUuid())) {
			throw new WebApplicationException("Organization can not be its own (grand…)parent");
		}

		final int numRows;
		try {
			numRows = dao.update(org);
		} catch (UnableToExecuteStatementException e) {
			throw ResponseUtils.handleSqlException(e, "Duplicate identification code");
		}

		if (numRows == 0) {
			throw new WebApplicationException("Couldn't process organization update", Status.NOT_FOUND);
		}

		if (org.getTasks() != null || org.getApprovalSteps() != null) {
			//Load the existing org, so we can check for differences.
			Organization existing = dao.getByUuid(org.getUuid());

			if (org.getTasks() != null) {
				logger.debug("Editing tasks for {}", org);
				Utils.addRemoveElementsByUuid(existing.loadTasks(), org.getTasks(),
						newTask -> engine.getTaskDao().setResponsibleOrgForTask(DaoUtils.getUuid(newTask), DaoUtils.getUuid(existing)),
						oldTaskUuid -> engine.getTaskDao().setResponsibleOrgForTask(oldTaskUuid, null));
			}

			if (org.getApprovalSteps() != null) {
				logger.debug("Editing approval steps for {}", org);
				for (ApprovalStep step : org.getApprovalSteps()) {
					validateApprovalStep(step);
					step.setAdvisorOrganizationUuid(org.getUuid());
				}
				List<ApprovalStep> existingSteps = existing.loadApprovalSteps(engine.getContext()).join();

				Utils.addRemoveElementsByUuid(existingSteps, org.getApprovalSteps(),
						newStep -> engine.getApprovalStepDao().insert(newStep),
						oldStepUuid -> engine.getApprovalStepDao().deleteStep(oldStepUuid));

				for (int i = 0;i < org.getApprovalSteps().size();i++) {
					ApprovalStep curr = org.getApprovalSteps().get(i);
					ApprovalStep next = (i == (org.getApprovalSteps().size() - 1)) ? null : org.getApprovalSteps().get(i + 1);
					curr.setNextStepUuid(DaoUtils.getUuid(next));
					ApprovalStep existingStep = Utils.getByUuid(existingSteps, curr.getUuid());
					//If this step didn't exist before, we still need to set the nextStepUuid on it, but don't need to do a deep update.
					if (existingStep == null) {
						engine.getApprovalStepDao().update(curr);
					} else {
						//Check for updates to name, nextStepUuid and approvers.
						updateStep(curr, existingStep);
					}
				}
			}
		}

		AnetAuditLogger.log("Organization {} updated by {}", org, user);
		// GraphQL mutations *have* to return something, so we return the number of updated rows
		return numRows;
	}

	@GraphQLQuery(name="organizationList")
	public AnetBeanList<Organization> search(@GraphQLArgument(name="query") OrganizationSearchQuery query) {
		return dao.search(query);
	}

	private void validateApprovalStep(ApprovalStep step) {
		if (Utils.isEmptyOrNull(step.getName())) {
			throw new WebApplicationException("A name is required for every approval step", Status.BAD_REQUEST);
		}
		if (Utils.isEmptyOrNull(step.getApprovers())) {
			throw new WebApplicationException("An approver is required for every approval step", Status.BAD_REQUEST);
		}
	}

	@GraphQLQuery(name="approvalStepInUse")
	public boolean isApprovalStepInUse(@GraphQLArgument(name="uuid") String uuid) {
		return engine.getApprovalStepDao().isStepInUse(uuid);
	}
}

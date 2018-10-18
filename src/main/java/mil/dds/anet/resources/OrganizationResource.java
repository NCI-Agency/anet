package mil.dds.anet.resources;

import java.lang.invoke.MethodHandles;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ExecutionException;

import javax.annotation.security.PermitAll;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.TransactionCallback;
import org.skife.jdbi.v2.TransactionStatus;
import org.skife.jdbi.v2.exceptions.UnableToExecuteStatementException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.codahale.metrics.annotation.Timed;

import io.dropwizard.auth.Auth;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Position;
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

@Path("/old-api/organizations")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class OrganizationResource {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	private OrganizationDao dao;
	private AnetObjectEngine engine;
	
	public OrganizationResource(AnetObjectEngine engine) {
		this.dao = engine.getOrganizationDao(); 
		this.engine = engine;
	}
	
	@GET
	@Timed
	@GraphQLQuery(name="organizations")
	@Path("/")
	public AnetBeanList<Organization> getAll(@DefaultValue("0") @QueryParam("pageNum") @GraphQLArgument(name="pageNum", defaultValue="0") Integer pageNum,
			@DefaultValue("100") @QueryParam("pageSize") @GraphQLArgument(name="pageSize", defaultValue="100") Integer pageSize) {
		return dao.getAll(pageNum, pageSize);
	} 

	@GET
	@Timed
	@GraphQLQuery(name="organizationTopLevelOrgs")
	@Path("/topLevel")
	public AnetBeanList<Organization> getTopLevelOrgs(@QueryParam("type") @GraphQLArgument(name="type") OrganizationType type) {
		return new AnetBeanList<Organization>(dao.getTopLevelOrgs(type));
	}

	@GET
	@Timed
	@GraphQLQuery(name="organization")
	@Path("/{id}")
	public Organization getById(@PathParam("id") @GraphQLArgument(name="id") int id) {
		Organization org = dao.getById(id);
		if (org == null) { throw new WebApplicationException(Status.NOT_FOUND); }
		return org;
	}

	@POST
	@Timed
	@Path("/new")
	@RolesAllowed("ADMINISTRATOR")
	public Organization createOrganization(@Auth Person user, Organization org) {
		return createOrganizationCommon(user, org);
	}

	private Organization createOrganizationCommon(Person user, Organization org) {
		AuthUtils.assertAdministrator(user);
		final Organization outer;
		outer = engine.getDbHandle().inTransaction(new TransactionCallback<Organization>() {
			@Override
			public Organization inTransaction(Handle conn, TransactionStatus status) throws Exception {
				Organization created;
				try {
					created = dao.insert(org);
				} catch (UnableToExecuteStatementException e) {
					throw ResponseUtils.handleSqlException(e, "Duplicate identification code");
				}

				if (org.getTasks() != null) {
					//Assign all of these tasks to this organization.
					for (Task p : org.getTasks()) {
						engine.getTaskDao().setResponsibleOrgForTask(p, created);
					}
				}
				if (org.getApprovalSteps() != null) {
					//Create the approval steps
					for (ApprovalStep step : org.getApprovalSteps()) {
						validateApprovalStep(step);
						step.setAdvisorOrganizationId(created.getId());
						engine.getApprovalStepDao().insertAtEnd(step);
					}
				}
				return created;
			}
		});
		AnetAuditLogger.log("Organization {} created by {}", outer, user);
		return outer;
	}

	@GraphQLMutation(name="createOrganization")
	@RolesAllowed("ADMINISTRATOR")
	public Organization createOrganization(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="organization") Organization org) {
		return createOrganizationCommon(DaoUtils.getUserFromContext(context), org);
	}

	/**
	 * Primary endpoint to update all aspects of an Organization.
	 * - Organization (shortName, longName, identificationCode)
	 * - Tasks
	 * - Approvers
	 */
	@POST
	@Timed
	@Path("/update")
	@RolesAllowed("SUPER_USER")
	public Response updateOrganization(@Auth Person user, Organization org) {
		updateOrganizationCommon(user, org);
		return Response.ok().build();
	}

	private int updateOrganizationCommon(Person user, Organization org) {
		final Handle dbHandle = AnetObjectEngine.getInstance().getDbHandle();
		return dbHandle.inTransaction(new TransactionCallback<Integer>() {
			public Integer inTransaction(Handle conn, TransactionStatus status) throws Exception {
				//Verify correct Organization
				AuthUtils.assertSuperUserForOrg(user, org);
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
					Organization existing = dao.getById(org.getId());

					if (org.getTasks() != null) {
						logger.debug("Editing tasks for {}", org);
						Utils.addRemoveElementsById(existing.loadTasks(), org.getTasks(),
								newTask -> engine.getTaskDao().setResponsibleOrgForTask(newTask, existing),
								oldTaskId -> engine.getTaskDao().setResponsibleOrgForTask(Task.createWithId(oldTaskId), null));
					}

					if (org.getApprovalSteps() != null) {
						logger.debug("Editing approval steps for {}", org);
						for (ApprovalStep step : org.getApprovalSteps()) {
							validateApprovalStep(step);
							step.setAdvisorOrganizationId(org.getId());
						}
						List<ApprovalStep> existingSteps = existing.loadApprovalSteps(engine.getContext()).get();

						Utils.addRemoveElementsById(existingSteps, org.getApprovalSteps(),
								newStep -> engine.getApprovalStepDao().insert(newStep),
								oldStepId -> engine.getApprovalStepDao().deleteStep(oldStepId));

						for (int i = 0;i < org.getApprovalSteps().size();i++) {
							ApprovalStep curr = org.getApprovalSteps().get(i);
							ApprovalStep next = (i == (org.getApprovalSteps().size() - 1)) ? null : org.getApprovalSteps().get(i + 1);
							curr.setNextStepId(DaoUtils.getId(next));
							ApprovalStep existingStep = Utils.getById(existingSteps, curr.getId());
							//If this step didn't exist before, we still need to set the nextStepId on it, but don't need to do a deep update.
							if (existingStep == null) {
								engine.getApprovalStepDao().update(curr);
							} else {
								//Check for updates to name, nextStepId and approvers.
								updateStep(curr, existingStep);
							}
						}
					}
				}

				AnetAuditLogger.log("Organization {} updated by {}", org, user);
				return numRows;
			}
		});
	}

	//Helper method that diffs the name/members of an approvalStep
	private void updateStep(ApprovalStep newStep, ApprovalStep oldStep) {
		final AnetObjectEngine engine = AnetObjectEngine.getInstance();
		final ApprovalStepDao approvalStepDao = engine.getApprovalStepDao();
		newStep.setId(oldStep.getId()); //Always want to make changes to the existing group
		if (!newStep.getName().equals(oldStep.getName())) {
			approvalStepDao.update(newStep);
		} else if (!Objects.equals(newStep.getNextStepId(), oldStep.getNextStepId())) {
			approvalStepDao.update(newStep);
		}

		if (newStep.getApprovers() != null) {
			try {
				Utils.addRemoveElementsById(oldStep.loadApprovers(engine.getContext()).get(), newStep.getApprovers(),
					newPosition -> approvalStepDao.addApprover(newStep, newPosition),
					oldPositionId -> approvalStepDao.removeApprover(newStep, Position.createWithId(oldPositionId)));
			} catch (InterruptedException | ExecutionException e) {
				throw new WebApplicationException("failed to load Approvers", e);
			}
		}
	}

	@GraphQLMutation(name="updateOrganization")
	@RolesAllowed("SUPER_USER")
	public Integer updateOrganization(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="organization") Organization org) {
		// GraphQL mutations *have* to return something, so we return the number of updated rows
		return updateOrganizationCommon(DaoUtils.getUserFromContext(context), org);
	}

	@POST
	@Timed
	@GraphQLQuery(name="organizationList")
	@Path("/search")
	public AnetBeanList<Organization> search(@GraphQLArgument(name="query") OrganizationSearchQuery query) {
		return dao.search(query);
	}
	
	@GET
	@Timed
	@Path("/search")
	public AnetBeanList<Organization> search(@Context HttpServletRequest request) {
		try {
			return search(ResponseUtils.convertParamsToBean(request, OrganizationSearchQuery.class));
		} catch (IllegalArgumentException e) {
			throw new WebApplicationException(e.getMessage(), e.getCause(), Status.BAD_REQUEST);
		}
	}

	private void validateApprovalStep(ApprovalStep step) {
		if (Utils.isEmptyOrNull(step.getName())) {
			throw new WebApplicationException("A name is required for every approval step", Status.BAD_REQUEST);
		}
		if (Utils.isEmptyOrNull(step.getApprovers())) {
			throw new WebApplicationException("An approver is required for every approval step", Status.BAD_REQUEST);
		}
	}
}

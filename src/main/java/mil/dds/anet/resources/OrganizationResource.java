package mil.dds.anet.resources;

import java.util.List;

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

import org.skife.jdbi.v2.exceptions.UnableToExecuteStatementException;

import com.codahale.metrics.annotation.Timed;
import com.microsoft.sqlserver.jdbc.SQLServerException;

import io.dropwizard.auth.Auth;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Poam;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.OrganizationList;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.PoamList;
import mil.dds.anet.beans.search.OrganizationSearchQuery;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.graphql.GraphQLFetcher;
import mil.dds.anet.graphql.GraphQLParam;
import mil.dds.anet.graphql.IGraphQLResource;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;
import mil.dds.anet.utils.Utils;

@Path("/api/organizations")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class OrganizationResource implements IGraphQLResource {

	private OrganizationDao dao;
	private AnetObjectEngine engine;
	
	public OrganizationResource(AnetObjectEngine engine) {
		this.dao = engine.getOrganizationDao(); 
		this.engine = engine;
	}
	
	@Override
	public Class<Organization> getBeanClass() {
		return Organization.class; 
	}
	
	public Class<OrganizationList> getBeanListClass() {
		return OrganizationList.class; 
	}
	
	@Override
	public String getDescription() {
		return "Organizations";
	}
	
	@GET
	@Timed
	@GraphQLFetcher
	@Path("/")
	public OrganizationList getAll(@DefaultValue("0") @QueryParam("pageNum") Integer pageNum, 
			@DefaultValue("100") @QueryParam("pageSize") Integer pageSize) {
		return dao.getAll(pageNum, pageSize);
	} 

	@GET
	@Timed
	@GraphQLFetcher
	@Path("/topLevel")
	public OrganizationList getTopLevelOrgs(@QueryParam("type") OrganizationType type) { 
		return new OrganizationList(dao.getTopLevelOrgs(type));
	}
	
	@POST
	@Timed
	@Path("/new")
	@RolesAllowed("ADMINISTRATOR")
	public Organization createNewOrganization(Organization org, @Auth Person user) {
		AuthUtils.assertAdministrator(user);
		final Organization created;
		try {
			created = dao.insert(org);
		} catch (UnableToExecuteStatementException e) {
			throw handleSqlException(e);
		}
		
		if (org.getPoams() != null) { 
			//Assign all of these poams to this organization. 
			for (Poam p : org.getPoams()) { 
				engine.getPoamDao().setResponsibleOrgForPoam(p, created);
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
		
		AnetAuditLogger.log("Organization {} created by {}", org, user);
		return created; 
	}
	
	@GET
	@Timed
	@GraphQLFetcher
	@Path("/{id}")
	public Organization getById(@PathParam("id") int id) {
		Organization org = dao.getById(id);
		if (org == null) { throw new WebApplicationException(Status.NOT_FOUND); } 
		return org;
	}
	
	/**
	 * Primary endpoint to update all aspects of an Organization.
	 * - Organization (shortName, longName, identificationCode)
	 * - Poams
	 * - Approvers
	 */
	@POST
	@Timed
	@Path("/update")
	@RolesAllowed("SUPER_USER")
	public Response updateOrganization(Organization org, @Auth Person user) { 
		//Verify correct Organization 
		AuthUtils.assertSuperUserForOrg(user, org);
		final int numRows;
		try {
			numRows = dao.update(org);
		} catch (UnableToExecuteStatementException e) {
			throw handleSqlException(e);
		}

		if (org.getPoams() != null || org.getApprovalSteps() != null) {
			//Load the existing org, so we can check for differences. 
			Organization existing = dao.getById(org.getId());
			
			if (org.getPoams() != null) {
				Utils.addRemoveElementsById(existing.loadPoams(), org.getPoams(), 
						newPoam -> engine.getPoamDao().setResponsibleOrgForPoam(newPoam, existing), 
						oldPoamId -> engine.getPoamDao().setResponsibleOrgForPoam(Poam.createWithId(oldPoamId), null));
			}
			
			if (org.getApprovalSteps() != null) {
				for (ApprovalStep step : org.getApprovalSteps()) {
					validateApprovalStep(step);
					step.setAdvisorOrganizationId(org.getId());
				}
				List<ApprovalStep> existingSteps = existing.loadApprovalSteps();
				
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
						ApprovalStepResource.updateStep(curr, existingStep);
					}
				}
			}
		}
		
		AnetAuditLogger.log("Organization {} edited by {}", org, user);
		return (numRows == 1) ? Response.ok().build() : Response.status(Status.NOT_FOUND).build();
	}
	
	@POST
	@Timed
	@GraphQLFetcher
	@Path("/search")
	public OrganizationList search(@GraphQLParam("query") OrganizationSearchQuery query) {
		return dao.search(query);
	}
	
	@GET
	@Timed
	@Path("/search")
	public OrganizationList search(@Context HttpServletRequest request) {
		try {
			return search(ResponseUtils.convertParamsToBean(request, OrganizationSearchQuery.class));
		} catch (IllegalArgumentException e) {
			throw new WebApplicationException(e.getMessage(), e.getCause(), Status.BAD_REQUEST);
		}
	}
	
	@GET
	@Timed
	@Path("/{id}/poams")
	public PoamList getPoams(@PathParam("id") Integer orgId) { 
		return new PoamList(AnetObjectEngine.getInstance().getPoamDao().getPoamsByOrganizationId(orgId));
	}

	private WebApplicationException handleSqlException(UnableToExecuteStatementException e) {
		// FIXME: Ugly way to handle the unique index on identificationCode
		final Throwable cause = e.getCause();
		if (cause != null && cause instanceof SQLServerException) {
			final String message = cause.getMessage();
			if (message != null && message.contains(" duplicate ")) {
				return new WebApplicationException("Duplicate identification code", Status.CONFLICT);
			}
		}
		return new WebApplicationException(Status.INTERNAL_SERVER_ERROR);
	}

	private void validateApprovalStep(ApprovalStep step) {
		if (Utils.isEmptyOrNull(step.getName())) {
			throw new WebApplicationException("A name is required for every approval step", Status.BAD_REQUEST);
		}
		if (Utils.isEmptyOrNull(step.loadApprovers())) {
			throw new WebApplicationException("An approver is required for every approval step", Status.BAD_REQUEST);
		}
	}
}

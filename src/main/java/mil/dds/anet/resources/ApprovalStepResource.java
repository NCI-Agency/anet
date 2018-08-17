package mil.dds.anet.resources;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

import javax.annotation.security.PermitAll;
import javax.annotation.security.RolesAllowed;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import com.codahale.metrics.annotation.Timed;

import io.dropwizard.auth.Auth;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.database.ApprovalStepDao;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.Utils;

@Path("/api/approvalSteps")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class ApprovalStepResource {

	AnetObjectEngine engine;
	ApprovalStepDao dao;
	
	public ApprovalStepResource(AnetObjectEngine engine) {
		this.engine = engine;
		this.dao = engine.getApprovalStepDao();
	}
	
	@GET
	@Timed
	@Path("/byOrganization")
	public List<ApprovalStep> getStepsForOrg(@QueryParam("orgId") Integer orgId) {
		try {
			return getStepsForOrg(engine.getContext(), orgId).get();
		} catch (InterruptedException | ExecutionException e) {
			throw new WebApplicationException("failed to load ApprovalStepsForOrg", e);
		}
	}

	@GraphQLQuery(name="approvalStepsForOrg")
	public CompletableFuture<List<ApprovalStep>> getStepsForOrg(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="orgId") Integer orgId) {
		return engine.getApprovalStepsForOrg(context, orgId);
	}

	@POST
	@Timed
	@Path("/new")
	@RolesAllowed("SUPER_USER")
	public ApprovalStep createNewStep(@Auth Person user, ApprovalStep as) {
		AuthUtils.assertSuperUserForOrg(user, Organization.createWithId(as.getAdvisorOrganizationId()));
		return engine.executeInTransaction(dao::insertAtEnd, as);
	}
	
	@POST
	@Timed
	@Path("/update")
	@RolesAllowed("SUPER_USER")
	public Response updateSteps(@Auth Person user, ApprovalStep as) {
		ApprovalStep existingStep = dao.getById(as.getId());
		int orgId = existingStep.getAdvisorOrganizationId();
		AuthUtils.assertSuperUserForOrg(user, Organization.createWithId(orgId));
		
		updateStep(as, existingStep);
		return Response.ok().build();
	}
	
	//Helper method that diffs the name/members of an approvalStep 
	public static void updateStep(ApprovalStep newStep, ApprovalStep oldStep) {
		AnetObjectEngine engine = AnetObjectEngine.getInstance();
		newStep.setId(oldStep.getId()); //Always want to make changes to the existing group
		if (newStep.getName().equals(oldStep.getName()) == false) { 
			engine.getApprovalStepDao().update(newStep);
		} else if (Objects.equals(newStep.getNextStepId(), oldStep.getNextStepId()) == false) { 
			engine.getApprovalStepDao().update(newStep);
		}
	
		if (newStep.getApprovers() != null) { 
			try {
				Utils.addRemoveElementsById(oldStep.loadApprovers(engine.getContext()).get(), newStep.getApprovers(),
					newPosition -> engine.getApprovalStepDao().addApprover(newStep, newPosition),
					oldPositionId -> engine.getApprovalStepDao().removeApprover(newStep, Position.createWithId(oldPositionId)));
			} catch (InterruptedException | ExecutionException e) {
				throw new WebApplicationException("failed to load Approvers", e);
			}
		}
	}
	
	@DELETE
	@Timed
	@Path("/{id}")
	@RolesAllowed("SUPER_USER")
	public Response deleteStep(@Auth Person user, @PathParam("id") int id) {
		ApprovalStep step = dao.getById(id);
		AuthUtils.assertSuperUserForOrg(user, Organization.createWithId(step.getAdvisorOrganizationId()));
		boolean success = engine.executeInTransaction(dao::deleteStep, id);
		return (success) ? Response.ok().build() : Response.status(Status.NOT_ACCEPTABLE).build();
	}
}

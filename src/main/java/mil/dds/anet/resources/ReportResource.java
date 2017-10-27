package mil.dds.anet.resources;

import java.io.StringWriter;
import java.lang.invoke.MethodHandles;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.annotation.security.PermitAll;
import javax.annotation.security.RolesAllowed;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.DELETE;
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

import org.joda.time.DateTime;
import org.joda.time.DateTimeConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.codahale.metrics.annotation.Timed;

import freemarker.template.Configuration;
import freemarker.template.DefaultObjectWrapperBuilder;
import freemarker.template.Template;
import io.dropwizard.auth.Auth;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.ApprovalAction;
import mil.dds.anet.beans.ApprovalAction.ApprovalType;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Person.Role;
import mil.dds.anet.beans.Poam;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.beans.RollupGraph;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AbstractAnetBeanList.ReportList;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.emails.ApprovalNeededEmail;
import mil.dds.anet.emails.DailyRollupEmail;
import mil.dds.anet.emails.NewReportCommentEmail;
import mil.dds.anet.emails.ReportEditedEmail;
import mil.dds.anet.emails.ReportEmail;
import mil.dds.anet.emails.ReportRejectionEmail;
import mil.dds.anet.emails.ReportReleasedEmail;
import mil.dds.anet.graphql.GraphQLFetcher;
import mil.dds.anet.graphql.GraphQLParam;
import mil.dds.anet.graphql.IGraphQLResource;
import mil.dds.anet.threads.AnetEmailWorker;
import mil.dds.anet.threads.AnetEmailWorker.AnetEmail;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.ResponseUtils;
import mil.dds.anet.utils.Utils;

@Path("/api/reports")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class ReportResource implements IGraphQLResource {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	ReportDao dao;
	AnetObjectEngine engine;
	AnetConfiguration config;

	public ReportResource(AnetObjectEngine engine, AnetConfiguration config) {
		this.engine = engine;
		this.dao = engine.getReportDao();
		this.config = config;
	}

	@Override
	public String getDescription() {
		return "Reports"; 
	}

	@Override
	public Class<Report> getBeanClass() {
		return Report.class; 
	}
	
	@Override
	public Class<ReportList> getBeanListClass() {
		return ReportList.class; 
	} 

	@GET
	@Timed
	@GraphQLFetcher
	@Path("/")
	public ReportList getAll(@Auth Person p, 
			@DefaultValue("0") @QueryParam("pageNum") Integer pageNum, 
			@DefaultValue("100") @QueryParam("pageSize") Integer pageSize) {
		return dao.getAll(pageNum, pageSize);
	}

	@GET
	@Timed
	@Path("/{id}")
	@GraphQLFetcher
	public Report getById(@PathParam("id") Integer id) {
		Report r = dao.getById(id);
		if (r == null) { throw new WebApplicationException(Status.NOT_FOUND); } 
		return r;
	}

	//Returns a dateTime representing the very end of today. 
	// Used to determine if a date is tomorrow or later. 
	private DateTime tomorrow() { 
		return DateTime.now().withHourOfDay(23).withMinuteOfHour(59).withSecondOfMinute(59);
	}
	
	// Helper method to determine if a report should be pushed into FUTURE state. 
	private boolean shouldBeFuture(Report r) { 
		return r.getEngagementDate() != null && r.getEngagementDate().isAfter(tomorrow()) && r.getCancelledReason() == null;
	}
	
	@POST
	@Timed
	@Path("/new")
	public Report createNewReport(@Auth Person author, Report r) {
		if (r.getState() == null) { r.setState(ReportState.DRAFT); }
		if (r.getAuthor() == null) { r.setAuthor(author); }
	
		Person primaryAdvisor = findPrimaryAttendee(r, Role.ADVISOR);
		if (r.getAdvisorOrg() == null && primaryAdvisor != null) {
			r.setAdvisorOrg(engine.getOrganizationForPerson(primaryAdvisor));
		}
		Person primaryPrincipal = findPrimaryAttendee(r, Role.PRINCIPAL);
		if (r.getPrincipalOrg() == null && primaryPrincipal != null) {
			r.setPrincipalOrg(engine.getOrganizationForPerson(primaryPrincipal));
		}
		
		if (shouldBeFuture(r)) { 
			r.setState(ReportState.FUTURE);
		}
		
		r.setReportText(Utils.sanitizeHtml(r.getReportText()));
		r = dao.insert(r);
		AnetAuditLogger.log("Report {} created by author {} ", r, author);
		return r;
	}

	private Person findPrimaryAttendee(Report r, Role role) { 
		if (r.getAttendees() == null) { return null; } 
		return r.getAttendees().stream().filter(p ->
				p.isPrimary() && p.getRole().equals(role)
			).findFirst().orElse(null);
	}
	
	@POST
	@Timed
	@Path("/update")
	public Response editReport(@Auth Person editor, Report r, @DefaultValue("true") @QueryParam("sendEditEmail") Boolean sendEmail) {
		//Verify this person has access to edit this report
		//Either they are the author, or an approver for the current step.
		Report existing = dao.getById(r.getId());
		r.setState(existing.getState());
		r.setApprovalStep(existing.getApprovalStep());
		r.setAuthor(existing.getAuthor());
		assertCanEditReport(r, editor);
		
		//If this report is in draft and in the future, set state to Future. 
		if (ReportState.DRAFT.equals(r.getState()) && shouldBeFuture(r)) { 
			r.setState(ReportState.FUTURE);
		} else if (ReportState.FUTURE.equals(r.getState()) && (r.getEngagementDate() == null || r.getEngagementDate().isBefore(tomorrow()))) {
			//This catches a user editing the report to change date back to the past. 
			r.setState(ReportState.DRAFT);
		} else if (ReportState.FUTURE.equals(r.getState()) && r.getCancelledReason() != null) {
			//Cancelled future engagements become draft. 
			r.setState(ReportState.DRAFT);
		}
		
		//If there is a change to the primary advisor, change the advisor Org. 
		Person primaryAdvisor = findPrimaryAttendee(r, Role.ADVISOR);
		if (Utils.idEqual(primaryAdvisor, existing.loadPrimaryAdvisor()) == false || existing.getAdvisorOrg() == null) { 
			r.setAdvisorOrg(engine.getOrganizationForPerson(primaryAdvisor));
		} else { 
			r.setAdvisorOrg(existing.getAdvisorOrg());
		}

		Person primaryPrincipal = findPrimaryAttendee(r, Role.PRINCIPAL);
		if (Utils.idEqual(primaryPrincipal, existing.loadPrimaryPrincipal()) ==  false || existing.getPrincipalOrg() == null) { 
			r.setPrincipalOrg(engine.getOrganizationForPerson(primaryPrincipal));
		} else { 
			r.setPrincipalOrg(existing.getPrincipalOrg());
		}
		
		r.setReportText(Utils.sanitizeHtml(r.getReportText()));
		dao.update(r);
		
		//Update Attendees:
		if (r.getAttendees() != null) { 
			//Fetch the people associated with this report
			List<ReportPerson> existingPeople = dao.getAttendeesForReport(r.getId());
			//Find any differences and fix them.
			for (ReportPerson rp : r.getAttendees()) {
				Optional<ReportPerson> existingPerson = existingPeople.stream().filter(el -> el.getId().equals(rp.getId())).findFirst();
				if (existingPerson.isPresent()) { 
					if (existingPerson.get().isPrimary() != rp.isPrimary()) { 
						dao.updateAttendeeOnReport(rp, r);
					}
					existingPeople.remove(existingPerson.get());
				} else { 
					dao.addAttendeeToReport(rp, r);
				}
			}
			//Any attendees left in existingPeople needs to be removed.
			for (ReportPerson rp : existingPeople) {
				dao.removeAttendeeFromReport(rp, r);
			}
		}

		//Update Poams:
		if (r.getPoams() != null) { 
			List<Poam> existingPoams = dao.getPoamsForReport(r);
			List<Integer> existingPoamIds = existingPoams.stream().map(p -> p.getId()).collect(Collectors.toList());
			for (Poam p : r.getPoams()) {
				int idx = existingPoamIds.indexOf(p.getId());
				if (idx == -1) { 
					dao.addPoamToReport(p, r); 
				} else {
					existingPoamIds.remove(idx); 
				}
			}
			for (Integer id : existingPoamIds) {
				dao.removePoamFromReport(Poam.createWithId(id), r);
			}
		}

		// Update Tags:
		if (r.getTags() != null) {
			List<Tag> existingTags = dao.getTagsForReport(r.getId());
			for (final Tag t : r.getTags()) {
				Optional<Tag> existingTag = existingTags.stream().filter(el -> el.getId().equals(t.getId())).findFirst();
				if (existingTag.isPresent()) {
					existingTags.remove(existingTag.get());
				} else {
					dao.addTagToReport(t, r);
				}
			}
			for (Tag t : existingTags) {
				dao.removeTagFromReport(t, r);
			}
		}
		
		if (sendEmail && existing.getState() == ReportState.PENDING_APPROVAL) {
			boolean canApprove = engine.canUserApproveStep(editor.getId(), existing.getApprovalStep().getId());
			if (canApprove) { 
				AnetEmail email = new AnetEmail();
				ReportEditedEmail action = new ReportEditedEmail();
				action.setReport(existing);
				action.setEditor(editor);
				email.setAction(action);
				email.setToAddresses(Collections.singletonList(existing.loadAuthor().getEmailAddress()));
				AnetEmailWorker.sendEmailAsync(email);
			}
		}
		
		return Response.ok().build();
	}

	private void assertCanEditReport(Report report, Person editor) {
		String permError = "You do not have permission to edit this report. ";
		switch (report.getState()) {
		case DRAFT:
		case REJECTED:
		case FUTURE:
			//Must be the author
			if (!report.getAuthor().getId().equals(editor.getId())) {
				throw new WebApplicationException(permError + "Must be the author of this report.", Status.FORBIDDEN);
			}
			break;
		case PENDING_APPROVAL:
			//Either the author, or the approver
			if (report.getAuthor().getId().equals(editor.getId())) {
				//This is okay, but move it back to draft
				report.setState(ReportState.DRAFT);
				report.setApprovalStep(null);
			} else {
				boolean canApprove = engine.canUserApproveStep(editor.getId(), report.getApprovalStep().getId());
				if (!canApprove) {
					throw new WebApplicationException(permError + "Must be the author or the current approver", Status.FORBIDDEN);
				}
			}
			break;
		case RELEASED:
		case CANCELLED:
			AnetAuditLogger.log("attempt to edit released report {} by editor {} (id: {}) was forbidden",
					report.getId(), editor.getName(), editor.getId());
			throw new WebApplicationException("Cannot edit a released report", Status.FORBIDDEN);
		}
	}
	
	/* Submit a report for approval
	 * Kicks a report from DRAFT to PENDING_APPROVAL and sets the approval step Id
	 */
	@POST
	@Timed
	@Path("/{id}/submit")
	public Report submitReport(@PathParam("id") int id) {
		Report r = dao.getById(id);
		//TODO: this needs to be done by either the Author, a Superuser for the AO, or an Administrator

		if (r.getAdvisorOrg() == null) {
			ReportPerson advisor = r.loadPrimaryAdvisor();
			if (advisor == null) {
				throw new WebApplicationException("Report missing primary advisor", Status.BAD_REQUEST);
			}
			r.setAdvisorOrg(engine.getOrganizationForPerson(advisor));
		}
		if (r.getPrincipalOrg() == null) {
			ReportPerson principal = r.loadPrimaryPrincipal();
			if (principal == null) {
				throw new WebApplicationException("Report missing primary principal", Status.BAD_REQUEST);
			}
			r.setPrincipalOrg(engine.getOrganizationForPerson(principal));
		}

		if (r.getEngagementDate() == null) {
			throw new WebApplicationException("Missing engagement date", Status.BAD_REQUEST);
		} else if (r.getEngagementDate().isAfter(tomorrow()) && r.getCancelledReason() == null) { 
			throw new WebApplicationException("You cannot submit future engagements less they are cancelled", Status.BAD_REQUEST);
		}

		Organization org = engine.getOrganizationForPerson(r.getAuthor());
		if (org == null) {
			// Author missing Org, use the Default Approval Workflow
			org = Organization.createWithId(
				Integer.parseInt(engine.getAdminSetting(AdminSettingKeys.DEFAULT_APPROVAL_ORGANIZATION)));
		}
		List<ApprovalStep> steps = engine.getApprovalStepsForOrg(org);
		if (steps == null || steps.size() == 0) {
			//Missing approval steps for this organization
			steps = engine.getApprovalStepsForOrg(
					Organization.createWithId(Integer.parseInt(engine.getAdminSetting(AdminSettingKeys.DEFAULT_APPROVAL_ORGANIZATION))));
		}

		//Push the report into the first step of this workflow
		r.setApprovalStep(steps.get(0));
		r.setState(ReportState.PENDING_APPROVAL);
		int numRows = dao.update(r);
		sendApprovalNeededEmail(r);
		logger.info("Putting report {} into step {} because of org {} on author {}",
				r.getId(), steps.get(0).getId(), org.getId(), r.getAuthor().getId());

		if (numRows != 1) {
			throw new WebApplicationException("No records updated", Status.BAD_REQUEST);
		}

		AnetAuditLogger.log("report {} submitted by author {} (id: {})", r.getId(), r.getAuthor().getName(), r.getAuthor().getId());
		return r;
	}

	private void sendApprovalNeededEmail(Report r) {
		ApprovalStep step = r.loadApprovalStep();
		List<Position> approvers = step.loadApprovers();
		AnetEmail approverEmail = new AnetEmail();
		ApprovalNeededEmail action = new ApprovalNeededEmail();
		action.setReport(r);
		approverEmail.setAction(action);
		
		approverEmail.setToAddresses(approvers.stream()
				.filter(a -> a.getPerson() != null)
				.map(a -> a.loadPerson().getEmailAddress())
				.collect(Collectors.toList()));
		AnetEmailWorker.sendEmailAsync(approverEmail);
	}

	/*
	 * Approve this report for the current step.
	 */
	@POST
	@Timed
	@Path("/{id}/approve")
	public Report approveReport(@Auth Person approver, @PathParam("id") int id, Comment comment) {
		Report r = dao.getById(id);
		if (r == null) {
			throw new WebApplicationException("Report not found", Status.NOT_FOUND);
		}
		if (r.getApprovalStep() == null) {
			logger.info("Report ID {} does not currently need an approval", r.getId());
			throw new WebApplicationException("This report is not pending approval", Status.BAD_REQUEST);
		}
		ApprovalStep step = r.loadApprovalStep();

		//Verify that this user can approve for this step.

		boolean canApprove = engine.canUserApproveStep(approver.getId(), step.getId());
		if (canApprove == false) {
			logger.info("User ID {} cannot approve report ID {} for step ID {}",approver.getId(), r.getId(), step.getId());
			throw new WebApplicationException("User cannot approve report", Status.FORBIDDEN);
		}

		//Write the approval
		//TODO: this should be in a transaction....
		ApprovalAction approval = new ApprovalAction();
		approval.setReport(r);
		approval.setStep(ApprovalStep.createWithId(step.getId()));
		approval.setPerson(approver);
		approval.setType(ApprovalType.APPROVE);
		engine.getApprovalActionDao().insert(approval);

		//Update the report
		r.setApprovalStep(ApprovalStep.createWithId(step.getNextStepId()));
		if (step.getNextStepId() == null) {
			//Done with approvals, move to released (or cancelled) state! 
			r.setState((r.getCancelledReason() != null) ? ReportState.CANCELLED : ReportState.RELEASED);
			r.setReleasedAt(DateTime.now());
			sendReportReleasedEmail(r);
		} else {
			sendApprovalNeededEmail(r);
		}
		dao.update(r);
		
		//Add the comment
		if (comment != null && comment.getText() != null && comment.getText().trim().length() > 0)  {
			comment.setReportId(r.getId());
			comment.setAuthor(approver);
			engine.getCommentDao().insert(comment);
		}
		//TODO: close the transaction.

		AnetAuditLogger.log("report {} approved by {} (id: {})", r.getId(), approver.getName(), approver.getId());
		return r;
	}

	private void sendReportReleasedEmail(Report r) {
		AnetEmail email = new AnetEmail();
		ReportReleasedEmail action = new ReportReleasedEmail();
		action.setReport(r);
		email.addToAddress(r.loadAuthor().getEmailAddress());
		email.setAction(action);
		AnetEmailWorker.sendEmailAsync(email);
	}
	
	/**
	 * Rejects a report and moves it back to the author with state REJECTED. 
	 * @param id the Report ID to reject
	 * @param reason : A @link Comment object which will be posted to the report with the reason why the report was rejected.
	 * @return 200 on a successful reject, 401 if you don't have privileges to reject this report.
	 */
	@POST
	@Timed
	@Path("/{id}/reject")
	public Report rejectReport(@Auth Person approver, @PathParam("id") int id, Comment reason) {
		Report r = dao.getById(id);
		if (r == null) { throw new WebApplicationException(Status.NOT_FOUND); } 
		ApprovalStep step = r.loadApprovalStep();
		if (step == null) {
			logger.info("Report ID {} does not currently need an approval", r.getId());
			throw new WebApplicationException("This report is not pending approval", Status.BAD_REQUEST); 
		} 

		//Verify that this user can reject for this step.
		boolean canApprove = engine.canUserApproveStep(approver.getId(), step.getId());
		if (canApprove == false) {
			logger.info("User ID {} cannot reject report ID {} for step ID {}",approver.getId(), r.getId(), step.getId());
			throw new WebApplicationException("User cannot approve report", Status.FORBIDDEN);
		}

		//Write the rejection
		//TODO: This should be in a transaction
		ApprovalAction approval = new ApprovalAction();
		approval.setReport(r);
		approval.setStep(ApprovalStep.createWithId(step.getId()));
		approval.setPerson(approver);
		approval.setType(ApprovalType.REJECT);
		engine.getApprovalActionDao().insert(approval);

		//Update the report
		r.setApprovalStep(null);
		r.setState(ReportState.REJECTED);
		dao.update(r);

		//Add the comment
		reason.setReportId(r.getId());
		reason.setAuthor(approver);
		engine.getCommentDao().insert(reason);

		//TODO: close the transaction.
		
		sendReportRejectEmail(r, approver, reason);
		AnetAuditLogger.log("report {} rejected by {} (id: {})", r.getId(), approver.getName(), approver.getId());
		return r;
	}

	private void sendReportRejectEmail(Report r, Person rejector, Comment rejectionComment) {
		ReportRejectionEmail action = new ReportRejectionEmail();
		action.setReport(r);
		action.setRejector(rejector);
		action.setComment(rejectionComment);
		AnetEmail email = new AnetEmail();
		email.setToAddresses(Collections.singletonList(r.loadAuthor().getEmailAddress()));
		email.setAction(action);
		AnetEmailWorker.sendEmailAsync(email);
	}
		
	@POST
	@Timed
	@Path("/{id}/comments")
	public Comment postNewComment(@Auth Person author, @PathParam("id") int reportId, Comment comment) {
		comment.setReportId(reportId);
		comment.setAuthor(author);
		comment = engine.getCommentDao().insert(comment);
		sendNewCommentEmail(dao.getById(reportId), comment);
		return comment;
	}

	private void sendNewCommentEmail(Report r, Comment comment) {
		AnetEmail email = new AnetEmail();
		NewReportCommentEmail action = new NewReportCommentEmail();
		action.setReport(r);
		action.setComment(comment);
		email.setToAddresses(Collections.singletonList(r.loadAuthor().getEmailAddress()));
		email.setAction(action);
		AnetEmailWorker.sendEmailAsync(email);
	}
	
	@GET
	@Timed
	@Path("/{id}/comments")
	public List<Comment> getCommentsForReport(@PathParam("id") int reportId) {
		return engine.getCommentDao().getCommentsForReport(Report.createWithId(reportId));
	}

	@DELETE
	@Timed
	@Path("/{id}/comments/{commentId}")
	public Response deleteComment(@PathParam("commentId") int commentId) {
		//TODO: user validation on /who/ is allowed to delete a comment.
		int numRows = engine.getCommentDao().delete(commentId);
		return (numRows == 1) ? Response.ok().build() : ResponseUtils.withMsg("Unable to delete comment", Status.NOT_FOUND);
	}

	@POST
	@Timed
	@Path("/{id}/email")
	public Response emailReport(@Auth Person user, @PathParam("id") int reportId, AnetEmail email) { 
		Report r = dao.getById(reportId);
		if (r == null) { return Response.status(Status.NOT_FOUND).build(); }
		
		ReportEmail action = new ReportEmail();
		action.setReport(Report.createWithId(reportId));
		action.setSender(user);
		action.setComment(email.getComment());
		email.setAction(action);
		AnetEmailWorker.sendEmailAsync(email);
		return Response.ok().build();
	}

	/*
	 * Delete a draft report. Authors can delete DRAFT, REJECTED reports. Admins can delete any report 
	 */
	@DELETE
	@Timed
	@Path("/{id}/delete")
	public Response deleteReport(@Auth Person user, @PathParam("id") int reportId) { 
		Report report = dao.getById(reportId);
		assertCanDeleteReport(report, user);

		dao.deleteReport(report);
		return Response.ok().build();
	}

	private void assertCanDeleteReport(Report report, Person user) {
		if (AuthUtils.isAdmin(user)) { return; } 
		
		if (report.getState() == ReportState.DRAFT || report.getState() == ReportState.REJECTED) { 
			//only the author may delete these reports
			if (Objects.equals(report.getAuthor().getId(), user.getId())) { 
				return;
			}
		}
		throw new WebApplicationException("You cannot delete this report", Status.FORBIDDEN);
	}
	
	@GET
	@Timed
	@Path("/search")
	public ReportList search(@Auth Person user, @Context HttpServletRequest request) {
		try {
			return search(ResponseUtils.convertParamsToBean(request, ReportSearchQuery.class), user);
		} catch (IllegalArgumentException e) {
			throw new WebApplicationException(e.getMessage(), e.getCause(), Status.BAD_REQUEST);
		}
	}

	@POST
	@Timed
	@GraphQLFetcher
	@Path("/search")
	public ReportList search(@GraphQLParam("query") ReportSearchQuery query, @Auth Person user) {
		return dao.search(query, user);
	}

	/** 
	 * 
	 * @param start Start timestamp for the rollup period
	 * @param end end timestamp for the rollup period
	 * @param engagementDateStart minimum date on reports to include 
	 * @param orgType  If orgId is NULL then the type of organization (ADVISOR_ORG or PRINCIPAL_ORG) that the chart should filter on
	 * @param orgId if orgType is NULL then the parent org to create the graph off of. All reports will be by/about this org or a child org. 
	 */
	@GET
	@Timed
	@Path("/rollupGraph")
	public List<RollupGraph> getDailyRollupGraph(@QueryParam("startDate") Long start, 
			@QueryParam("endDate") Long end, 
			@QueryParam("orgType") OrganizationType orgType, 
			@QueryParam("advisorOrganizationId") Integer advisorOrgId,
			@QueryParam("principalOrganizationId") Integer principalOrgId) {
		DateTime startDate = new DateTime(start);
		DateTime endDate = new DateTime(end);
		if (principalOrgId != null) { 
			return dao.getDailyRollupGraph(startDate, endDate, principalOrgId, OrganizationType.PRINCIPAL_ORG);
		} else if (advisorOrgId != null) { 
			return dao.getDailyRollupGraph(startDate, endDate, advisorOrgId, OrganizationType.ADVISOR_ORG);
		}
		
		if (orgType == null) { orgType = OrganizationType.ADVISOR_ORG; } 
		return dao.getDailyRollupGraph(startDate, endDate, orgType);
	}

	@POST
	@Timed
	@Path("/rollup/email")
	public Response emailRollup(@Auth Person user, 
			@QueryParam("startDate") Long start, 
			@QueryParam("endDate") Long end, 
			@QueryParam("orgType") OrganizationType orgType, 
			@QueryParam("advisorOrganizationId") Integer advisorOrgId,
			@QueryParam("principalOrganizationId") Integer principalOrgId,
			AnetEmail email) {
		DailyRollupEmail action = new DailyRollupEmail();
		action.setStartDate(new DateTime(start));
		action.setEndDate(new DateTime(end));
		action.setComment(email.getComment());
		action.setAdvisorOrganizationId(advisorOrgId);
		action.setPrincipalOrganizationId(principalOrgId);
		action.setChartOrgType(orgType);

		email.setAction(action);
		AnetEmailWorker.sendEmailAsync(email);
		
		return Response.ok().build();
	}
	
	/* Used to generate an HTML view of the daily rollup email
	 * 
	 */
	@GET
	@Timed
	@Path("/rollup")
	@Produces(MediaType.TEXT_HTML)
	public Response showRollupEmail(@Auth Person user, @QueryParam("startDate") Long start, 
			@QueryParam("endDate") Long end, 
			@QueryParam("orgType") OrganizationType orgType, 
			@QueryParam("advisorOrganizationId") Integer advisorOrgId,
			@QueryParam("principalOrganizationId") Integer principalOrgId,
			@QueryParam("showText") @DefaultValue("false") Boolean showReportText) {
		DailyRollupEmail action = new DailyRollupEmail();
		action.setStartDate(new DateTime(start));
		action.setEndDate(new DateTime(end));
		action.setChartOrgType(orgType);
		action.setAdvisorOrganizationId(advisorOrgId);
		action.setPrincipalOrganizationId(principalOrgId);
		
		Map<String,Object> context = action.execute();
		context.put("serverUrl", config.getServerUrl());
		context.put(AdminSettingKeys.SECURITY_BANNER_TEXT.name(), engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_TEXT));
		context.put(AdminSettingKeys.SECURITY_BANNER_COLOR.name(), engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_COLOR));
		context.put(DailyRollupEmail.SHOW_REPORT_TEXT_FLAG, showReportText);
		
		try { 
			Configuration freemarkerConfig = new Configuration(Configuration.getVersion());
			freemarkerConfig.setObjectWrapper(new DefaultObjectWrapperBuilder(Configuration.getVersion()).build());
			freemarkerConfig.loadBuiltInEncodingMap();
			freemarkerConfig.setDefaultEncoding(StandardCharsets.UTF_8.name());
			freemarkerConfig.setClassForTemplateLoading(this.getClass(), "/");
			freemarkerConfig.setAPIBuiltinEnabled(true);
			
			Template temp = freemarkerConfig.getTemplate(action.getTemplateName());
			StringWriter writer = new StringWriter();
			temp.process(context, writer);
			
			return Response.ok(writer.toString(), MediaType.TEXT_HTML_TYPE).build();
		} catch (Exception e) { 
			throw new WebApplicationException(e);
		}
	}

	/**
	 *
	 * Gets aggregated data per organization for engagements attended and reports submitted
	 * for each advisor in a given organization.
	 * @param weeksAgo Weeks ago integer for the amount of weeks before the current week
	 *
	 */
	@GET
	@Timed
	@Path("/insights/advisors")
	@RolesAllowed("SUPER_USER")
	public List<Map<String, Object>> getAdvisorReportInsights(
		@DefaultValue("3") 	@QueryParam("weeksAgo") int weeksAgo,
		@DefaultValue("-1") @QueryParam("orgId") int orgId) {

		DateTime now = DateTime.now();
		DateTime weekStart = now.withDayOfWeek(DateTimeConstants.MONDAY).withTimeAtStartOfDay();
		DateTime startDate = weekStart.minusWeeks(weeksAgo);
		final List<Map<String, Object>> list = dao.getAdvisorReportInsights(startDate, now, orgId);

		if(orgId < 0){
			final Set<String> tlf = Stream.of("organizationshortname").collect(Collectors.toSet());
			return Utils.resultGrouper(list, "stats", "organizationid", tlf);
		} else {
			final Set<String> tlf = Stream.of("name").collect(Collectors.toSet());
			return Utils.resultGrouper(list, "stats", "personId", tlf);
		}
	}
}

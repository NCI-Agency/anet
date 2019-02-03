package mil.dds.anet.resources;

import java.io.StringWriter;
import java.lang.invoke.MethodHandles;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ExecutionException;
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
import org.skife.jdbi.v2.Handle;
import org.skife.jdbi.v2.TransactionCallback;
import org.skife.jdbi.v2.TransactionStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.codahale.metrics.annotation.Timed;

import freemarker.template.Configuration;
import freemarker.template.DefaultObjectWrapperBuilder;
import freemarker.template.Template;
import io.dropwizard.auth.Auth;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AdvisorReportsEntry;
import mil.dds.anet.beans.AdvisorReportsStats;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.ApprovalAction;
import mil.dds.anet.beans.ApprovalAction.ApprovalType;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Person.Role;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.beans.RollupGraph;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AnetBeanList;
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
import mil.dds.anet.threads.AnetEmailWorker;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResponseUtils;
import mil.dds.anet.utils.Utils;

@Path("/old-api/reports")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class ReportResource {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	ReportDao dao;
	AnetObjectEngine engine;
	AnetConfiguration config;

	private final RollupGraphComparator rollupGraphComparator;

	public ReportResource(AnetObjectEngine engine, AnetConfiguration config) {
		this.engine = engine;
		this.dao = engine.getReportDao();
		this.config = config;

		@SuppressWarnings("unchecked")
		List<String> pinnedOrgNames = (List<String>)this.config.getDictionary().get("pinned_ORGs");

		this.rollupGraphComparator = new RollupGraphComparator(pinnedOrgNames);

	}

	@GET
	@Timed
	@GraphQLQuery(name="reports")
	@Path("/")
	public AnetBeanList<Report> getAll(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="_") @Auth Person user,
			@DefaultValue("0") @QueryParam("pageNum") @GraphQLArgument(name="pageNum", defaultValue="0") Integer pageNum,
			@DefaultValue("100") @QueryParam("pageSize") @GraphQLArgument(name="pageSize", defaultValue="100") Integer pageSize) {
		user = DaoUtils.getUser(context, user);
		return dao.getAll(pageNum, pageSize, user);
	}

	@GET
	@Timed
	@Path("/{id}")
	@GraphQLQuery(name="report")
	public Report getById(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="_") @Auth Person user,
			@PathParam("id") @GraphQLArgument(name="id") Integer id) {
		user = DaoUtils.getUser(context, user);
		final Report r = dao.getById(id, user);
		if (r == null) { throw new WebApplicationException("Report not found", Status.NOT_FOUND); }
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
	public Report createReport(@Auth Person author, Report r) {
		return createReportCommon(author, r);
	}

	private Report createReportCommon(Person author, Report r) {
		if (r.getState() == null) { r.setState(ReportState.DRAFT); }
		if (r.getAuthor() == null) { r.setAuthor(author); }

		Person primaryAdvisor = findPrimaryAttendee(r, Role.ADVISOR);
		if (r.getAdvisorOrg() == null && primaryAdvisor != null) {
			try {
				logger.debug("Setting advisor org for new report based on {}", primaryAdvisor);
				r.setAdvisorOrg(engine.getOrganizationForPerson(engine.getContext(), primaryAdvisor).get());
			} catch (InterruptedException | ExecutionException e) {
				throw new WebApplicationException("failed to load Organization for PrimaryAdvisor", e);
			}
		}
		Person primaryPrincipal = findPrimaryAttendee(r, Role.PRINCIPAL);
		if (r.getPrincipalOrg() == null && primaryPrincipal != null) {
			try {
				logger.debug("Setting principal org for new report based on {}", primaryPrincipal);
				r.setPrincipalOrg(engine.getOrganizationForPerson(engine.getContext(), primaryPrincipal).get());
			} catch (InterruptedException | ExecutionException e) {
				throw new WebApplicationException("failed to load Organization for PrimaryPrincipal", e);
			}
		}

		if (shouldBeFuture(r)) {
			r.setState(ReportState.FUTURE);
		}

		r.setReportText(Utils.sanitizeHtml(r.getReportText()));
		r = dao.insert(r, author);
		AnetAuditLogger.log("Report {} created by author {} ", r, author);
		return r;
	}

	@GraphQLMutation(name="createReport")
	public Report createReport(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="report") Report r) {
		return createReportCommon(DaoUtils.getUserFromContext(context), r);
	}

	@POST
	@Timed
	@Path("/update")
	public Report updateReport(@Auth Person editor, Report r, @DefaultValue("true") @QueryParam("sendEditEmail") boolean sendEmail) {
		return updateReportCommon(editor, r, sendEmail);
	}

	private Report updateReportCommon(Person editor, Report r, Boolean sendEmail) {
		// perform all modifications to the report and its tasks and steps in a single transaction, returning the original state of the report
		final Report existing = engine.executeInTransaction(this::executeReportUpdates, editor, r);

		if (sendEmail && existing.getState() == ReportState.PENDING_APPROVAL) {
			boolean canApprove = engine.canUserApproveStep(engine.getContext(), editor.getId(), existing.getApprovalStep().getId());
			if (canApprove) {
				AnetEmail email = new AnetEmail();
				ReportEditedEmail action = new ReportEditedEmail();
				action.setReport(existing);
				action.setEditor(editor);
				email.setAction(action);
				try {
					email.setToAddresses(Collections.singletonList(existing.loadAuthor(engine.getContext()).get().getEmailAddress()));
					AnetEmailWorker.sendEmailAsync(email);
				} catch (InterruptedException | ExecutionException e) {
					throw new WebApplicationException("failed to load Author", e);
				}
			}
		}

		// Possibly load sensitive information; needed in case of autoSave by the client form
		r.setUser(editor);
		try {
			r.loadReportSensitiveInformation(engine.getContext()).get();
		} catch (InterruptedException | ExecutionException e) {
			throw new WebApplicationException("failed to load ReportSensitiveInformation", e);
		}

		// Return the report in the response; used in autoSave by the client form
		return r;
	}

	@GraphQLMutation(name="updateReport")
	public Report updateReport(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="report") Report r, @GraphQLArgument(name="sendEditEmail", defaultValue="true") boolean sendEmail) {
		// GraphQL mutations *have* to return something, we return the report, used in autoSave
		return updateReportCommon(DaoUtils.getUserFromContext(context), r, sendEmail);
	}

	private Person findPrimaryAttendee(Report r, Role role) {
		if (r.getAttendees() == null) { return null; }
		return r.getAttendees().stream().filter(p ->
				p.isPrimary() && p.getRole().equals(role)
			).findFirst().orElse(null);
	}

	/** Perform all modifications to the report and its tasks and steps, returning the original state of the report.  Should be wrapped in
	 * a single transaction to ensure consistency.
	 * @param editor the current user (for authorization checks)
	 * @param r a Report object with the desired modifications
	 * @return the report as it was stored in the database before this method was called.
	 */
	private Report executeReportUpdates(Person editor, Report r) {
		//Verify this person has access to edit this report
		//Either they are the author, or an approver for the current step.
		final Report existing = dao.getById(r.getId(), editor);
		if (existing == null) { throw new WebApplicationException("Report not found", Status.NOT_FOUND); }
		r.setState(existing.getState());
		r.setApprovalStep(existing.getApprovalStep());
		r.setAuthor(existing.getAuthor());
		assertCanUpdateReport(r, editor);

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
		ReportPerson exstingPrimaryAdvisor;
		try {
			exstingPrimaryAdvisor = existing.loadPrimaryAdvisor(engine.getContext()).get();
			if (Utils.idEqual(primaryAdvisor, exstingPrimaryAdvisor) == false || existing.getAdvisorOrg() == null) {
				r.setAdvisorOrg(engine.getOrganizationForPerson(engine.getContext(), primaryAdvisor).get());
			} else {
				r.setAdvisorOrg(existing.getAdvisorOrg());
			}
		} catch (InterruptedException | ExecutionException e) {
			throw new WebApplicationException("failed to load PrimaryAdvisor", e);
		}

		Person primaryPrincipal = findPrimaryAttendee(r, Role.PRINCIPAL);
		ReportPerson existingPrimaryPrincipal;
		try {
			existingPrimaryPrincipal = existing.loadPrimaryPrincipal(engine.getContext()).get();
			if (Utils.idEqual(primaryPrincipal, existingPrimaryPrincipal) ==  false || existing.getPrincipalOrg() == null) {
				r.setPrincipalOrg(engine.getOrganizationForPerson(engine.getContext(), primaryPrincipal).get());
			} else {
				r.setPrincipalOrg(existing.getPrincipalOrg());
			}
		} catch (InterruptedException | ExecutionException e) {
			throw new WebApplicationException("failed to load PrimaryPrincipal", e);
		}

		r.setReportText(Utils.sanitizeHtml(r.getReportText()));

		// begin DB modifications
		final int numRows = dao.update(r, editor);
		if (numRows == 0) {
			throw new WebApplicationException("Couldn't process report update", Status.NOT_FOUND);
		}

		//Update Attendees:
		if (r.getAttendees() != null) {
			try {
				//Fetch the people associated with this report
				List<ReportPerson> existingPeople = dao.getAttendeesForReport(engine.getContext(), r.getId()).get();
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
			} catch (InterruptedException | ExecutionException e) {
				throw new WebApplicationException("failed to load Attendees", e);
			}
		}

		//Update Tasks:
		if (r.getTasks() != null) {
			try {
				List<Task> existingTasks = dao.getTasksForReport(engine.getContext(), r.getId()).get();
				List<Integer> existingTaskIds = existingTasks.stream().map(p -> p.getId()).collect(Collectors.toList());
				for (Task p : r.getTasks()) {
					int idx = existingTaskIds.indexOf(p.getId());
					if (idx == -1) {
						dao.addTaskToReport(p, r);
					} else {
						existingTaskIds.remove(idx);
					}
				}
				for (Integer id : existingTaskIds) {
					dao.removeTaskFromReport(Task.createWithId(id), r);
				}
			} catch (InterruptedException | ExecutionException e) {
				throw new WebApplicationException("failed to load Tasks", e);
			}
		}

		// Update Tags:
		if (r.getTags() != null) {
			try {
				List<Tag> existingTags = dao.getTagsForReport(engine.getContext(), r.getId()).get();
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
			} catch (InterruptedException | ExecutionException e) {
				throw new WebApplicationException("failed to load Tags", e);
			}
		}

		// Update AuthorizationGroups:
		if (r.getAuthorizationGroups() != null) {
			final List<AuthorizationGroup> existingAuthorizationGroups = dao.getAuthorizationGroupsForReport(r.getId());
			for (final AuthorizationGroup t : r.getAuthorizationGroups()) {
				Optional<AuthorizationGroup> existingAuthorizationGroup = existingAuthorizationGroups.stream().filter(el -> el.getId().equals(t.getId())).findFirst();
				if (existingAuthorizationGroup.isPresent()) {
					existingAuthorizationGroups.remove(existingAuthorizationGroup.get());
				} else {
					dao.addAuthorizationGroupToReport(t, r);
				}
			}
			for (final AuthorizationGroup t : existingAuthorizationGroups) {
				dao.removeAuthorizationGroupFromReport(t, r);
			}
		}

		// Possibly load sensitive information; needed in case of autoSave by the client form
		r.setUser(editor);
		try {
			r.loadReportSensitiveInformation(engine.getContext()).get();
		} catch (InterruptedException | ExecutionException e) {
			throw new WebApplicationException("failed to load ReportSensitiveInformation", e);
		}

		// Return the report in the response; used in autoSave by the client form
		return existing;
	}

	private void assertCanUpdateReport(Report report, Person editor) {
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
			//Only the approver
			boolean canApprove = engine.canUserApproveStep(engine.getContext(), editor.getId(), report.getApprovalStep().getId());
			if (!canApprove) {
				throw new WebApplicationException(permError + "Must be the current approver.", Status.FORBIDDEN);
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
	public Report submitReport(@Auth Person user, @PathParam("id") int id) {
		return submitReportCommon(user, id);
	}

	private Report submitReportCommon(Person user, int id) {
		final Report r = dao.getById(id, user);
		if (r == null) { throw new WebApplicationException("Report not found", Status.NOT_FOUND); }
		logger.debug("Attempting to submit report {}, which has advisor org {} and primary advisor {}", r, r.getAdvisorOrg(), r.getPrimaryAdvisor());

		// TODO: this needs to be done by either the Author, a Superuser for the AO, or an Administrator
		if (r.getAdvisorOrg() == null) {
			ReportPerson advisor;
			try {
				advisor = r.loadPrimaryAdvisor(engine.getContext()).get();
				if (advisor == null) {
					throw new WebApplicationException("Report missing primary advisor", Status.BAD_REQUEST);
				}
				r.setAdvisorOrg(engine.getOrganizationForPerson(engine.getContext(), advisor).get());
			} catch (InterruptedException | ExecutionException e) {
				throw new WebApplicationException("failed to load PrimaryAdvisor", e);
			}
		}
		if (r.getPrincipalOrg() == null) {
			ReportPerson principal;
			try {
				principal = r.loadPrimaryPrincipal(engine.getContext()).get();
				if (principal == null) {
					throw new WebApplicationException("Report missing primary principal", Status.BAD_REQUEST);
				}
				r.setPrincipalOrg(engine.getOrganizationForPerson(engine.getContext(), principal).get());
			} catch (InterruptedException | ExecutionException e) {
				throw new WebApplicationException("failed to load PrimaryPrincipal", e);
			}
		}

		if (r.getEngagementDate() == null) {
			throw new WebApplicationException("Missing engagement date", Status.BAD_REQUEST);
		} else if (r.getEngagementDate().isAfter(tomorrow()) && r.getCancelledReason() == null) {
			throw new WebApplicationException("You cannot submit future engagements less they are cancelled", Status.BAD_REQUEST);
		}

		final Integer orgId;
		try {
			final Organization org = engine.getOrganizationForPerson(engine.getContext(), r.getAuthor()).get();
			if (org == null) {
				// Author missing Org, use the Default Approval Workflow
				orgId = engine.getDefaultOrgId();
			} else {
				orgId = org.getId();
			}
		} catch (InterruptedException | ExecutionException e) {
			throw new WebApplicationException("failed to load Organization for Author", e);
		}
		List<ApprovalStep> steps = null;
		try {
			steps = engine.getApprovalStepsForOrg(engine.getContext(), orgId).get();
			throwExceptionNoApprovalSteps(steps);
		} catch (InterruptedException | ExecutionException e) {
			throw new WebApplicationException("failed to load Organization for Author", e);
		}

		//Push the report into the first step of this workflow
		r.setApprovalStep(steps.get(0));
		r.setState(ReportState.PENDING_APPROVAL);
		final int numRows = engine.executeInTransaction(dao::update, r, user);
		sendApprovalNeededEmail(r);
		logger.info("Putting report {} into step {} because of org {} on author {}",
				r.getId(), steps.get(0).getId(), orgId, r.getAuthor().getId());

		if (numRows != 1) {
			throw new WebApplicationException("No records updated", Status.BAD_REQUEST);
		}

		AnetAuditLogger.log("report {} submitted by author {} (id: {})", r.getId(), r.getAuthor().getName(), r.getAuthor().getId());
		return r;
	}

	@GraphQLMutation(name="submitReport")
	public Report submitReport(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="id") int id) {
		// GraphQL mutations *have* to return something, we return the report
		return submitReportCommon(DaoUtils.getUserFromContext(context), id);
	}

	/***
	 * Throws a WebApplicationException when the report does not have an approval chain belonging to the advisor organization
	 */
	private void throwExceptionNoApprovalSteps(List<ApprovalStep> steps) {
		if (Utils.isEmptyOrNull(steps)) {
			final String supportEmailAddr = (String)this.config.getDictionary().get("SUPPORT_EMAIL_ADDR");
			final String messageBody = "Advisor organization is missing a report approval chain. In order to have an approval chain created for the primary advisor attendee's advisor organization, please contact the ANET support team";
			final String errorMessage = Utils.isEmptyOrNull(supportEmailAddr) ? messageBody : String.format("%s at %s", messageBody, supportEmailAddr);
			throw new WebApplicationException(errorMessage, Status.BAD_REQUEST);
		}
	}

	private void sendApprovalNeededEmail(Report r) {
		final ApprovalStep step;
		try {
			step = r.loadApprovalStep(engine.getContext()).get();
		} catch (InterruptedException | ExecutionException e) {
			throw new WebApplicationException("failed to load ApprovalStep", e);
		}
		final List<Position> approvers;
		try {
			approvers = step.loadApprovers(engine.getContext()).get();
		} catch (InterruptedException | ExecutionException e) {
			throw new WebApplicationException("failed to load Approvers", e);
		}
		AnetEmail approverEmail = new AnetEmail();
		ApprovalNeededEmail action = new ApprovalNeededEmail();
		action.setReport(r);
		approverEmail.setAction(action);
		approverEmail.setToAddresses(approvers.stream()
				.filter(a -> (a.getPerson() != null) && !a.getPerson().getId().equals(r.getAuthor().getId()) )
				.map(a -> {
					try {
						return a.loadPerson(engine.getContext()).get().getEmailAddress();
					} catch (InterruptedException | ExecutionException e) {
						throw new WebApplicationException("failed to load Person", e);
					}
				})
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
		return approveReportCommon(approver, id, comment);
	}

	private Report approveReportCommon(Person approver, int id, Comment comment) {
		final Handle dbHandle = AnetObjectEngine.getInstance().getDbHandle();
		return dbHandle.inTransaction(new TransactionCallback<Report>() {
			public Report inTransaction(Handle conn, TransactionStatus status) throws Exception {
				final Report r = dao.getById(id, approver);
				if (r == null) { throw new WebApplicationException("Report not found", Status.NOT_FOUND); }
				final ApprovalStep step = r.loadApprovalStep(engine.getContext()).get();
				if (step == null) {
					logger.info("Report ID {} does not currently need an approval", r.getId());
					throw new WebApplicationException("This report is not pending approval", Status.BAD_REQUEST);
				}

				//Verify that this user can approve for this step.
				boolean canApprove = engine.canUserApproveStep(engine.getContext(), approver.getId(), step.getId());
				if (canApprove == false) {
					logger.info("User ID {} cannot approve report ID {} for step ID {}",approver.getId(), r.getId(), step.getId());
					throw new WebApplicationException("User cannot approve report", Status.FORBIDDEN);
				}

				//Write the approval
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
				final int numRows = dao.update(r, approver);
				if (numRows == 0) {
					throw new WebApplicationException("Couldn't process report approval", Status.NOT_FOUND);
				}

				//Add the comment
				if (comment != null && comment.getText() != null && comment.getText().trim().length() > 0)  {
					comment.setReportId(r.getId());
					comment.setAuthor(approver);
					engine.getCommentDao().insert(comment);
				}

				AnetAuditLogger.log("Report {} approved by {} (id: {})", r.getId(), approver.getName(), approver.getId());
				return r;
			}
		});
	}

	@GraphQLMutation(name="approveReport")
	public Report approveReport(@GraphQLRootContext Map<String, Object> context,
			@GraphQLArgument(name="id") int id,
			@GraphQLArgument(name="comment") Comment comment) {
		// GraphQL mutations *have* to return something
		return approveReportCommon(DaoUtils.getUserFromContext(context), id, comment);
	}

	private void sendReportReleasedEmail(Report r) {
		AnetEmail email = new AnetEmail();
		ReportReleasedEmail action = new ReportReleasedEmail();
		action.setReport(r);
		email.setAction(action);
		try {
			email.addToAddress(r.loadAuthor(engine.getContext()).get().getEmailAddress());
			AnetEmailWorker.sendEmailAsync(email);
		} catch (InterruptedException | ExecutionException e) {
			throw new WebApplicationException("failed to load Author", e);
		}
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
		return rejectReportCommon(approver, id, reason);
	}

	private Report rejectReportCommon(Person approver, int id, Comment reason) {
		final Handle dbHandle = AnetObjectEngine.getInstance().getDbHandle();
		return dbHandle.inTransaction(new TransactionCallback<Report>() {
			public Report inTransaction(Handle conn, TransactionStatus status) throws Exception {
				final Report r = dao.getById(id, approver);
				if (r == null) { throw new WebApplicationException("Report not found", Status.NOT_FOUND); }
				final ApprovalStep step = r.loadApprovalStep(engine.getContext()).get();
				if (step == null) {
					logger.info("Report ID {} does not currently need an approval", r.getId());
					throw new WebApplicationException("This report is not pending approval", Status.BAD_REQUEST);
				}

				//Verify that this user can reject for this step.
				boolean canApprove = engine.canUserApproveStep(engine.getContext(), approver.getId(), step.getId());
				if (canApprove == false) {
					logger.info("User ID {} cannot request changes to report ID {} for step ID {}",approver.getId(), r.getId(), step.getId());
					throw new WebApplicationException("User cannot approve report", Status.FORBIDDEN);
				}

				//Write the rejection
				ApprovalAction approval = new ApprovalAction();
				approval.setReport(r);
				approval.setStep(ApprovalStep.createWithId(step.getId()));
				approval.setPerson(approver);
				approval.setType(ApprovalType.REJECT);
				engine.getApprovalActionDao().insert(approval);

				//Update the report
				r.setApprovalStep(null);
				r.setState(ReportState.REJECTED);
				final int numRows = dao.update(r, approver);
				if (numRows == 0) {
					throw new WebApplicationException("Couldn't process report change request", Status.NOT_FOUND);
				}

				//Add the comment
				reason.setReportId(r.getId());
				reason.setAuthor(approver);
				engine.getCommentDao().insert(reason);

				sendReportRejectEmail(r, approver, reason);
				AnetAuditLogger.log("report {} has requested changes by {} (id: {})", r.getId(), approver.getName(), approver.getId());
				return r;
			}
		});
	}

	@GraphQLMutation(name="rejectReport")
	public Report rejectReport(@GraphQLRootContext Map<String, Object> context,
			@GraphQLArgument(name="id") int id,
			@GraphQLArgument(name="comment") Comment reason) {
		// GraphQL mutations *have* to return something
		return rejectReportCommon(DaoUtils.getUserFromContext(context), id, reason);
	}

	private void sendReportRejectEmail(Report r, Person rejector, Comment rejectionComment) {
		ReportRejectionEmail action = new ReportRejectionEmail();
		action.setReport(r);
		action.setRejector(rejector);
		action.setComment(rejectionComment);
		AnetEmail email = new AnetEmail();
		email.setAction(action);
		try {
			email.addToAddress(r.loadAuthor(engine.getContext()).get().getEmailAddress());
			AnetEmailWorker.sendEmailAsync(email);
		} catch (InterruptedException | ExecutionException e) {
			throw new WebApplicationException("failed to load Author", e);
		}
	}

	@POST
	@Timed
	@Path("/{id}/comments")
	public Comment addComment(@Auth Person author, @PathParam("id") int reportId, Comment comment) {
		return addCommentCommon(author, reportId, comment);
	}

	private Comment addCommentCommon(@Auth Person author, @PathParam("id") int reportId, Comment comment) {
		comment.setReportId(reportId);
		comment.setAuthor(author);
		comment = engine.getCommentDao().insert(comment);
		if (comment == null) {
			throw new WebApplicationException("Couldn't process adding new comment");
		}
		final Report r = dao.getById(reportId, author);
		if (r == null) { throw new WebApplicationException("Report not found", Status.NOT_FOUND); }
		sendNewCommentEmail(r, comment);
		return comment;
	}

	@GraphQLMutation(name="addComment")
	public Comment addComment(@GraphQLRootContext Map<String, Object> context,
			@GraphQLArgument(name="id") int reportId,
			@GraphQLArgument(name="comment") Comment comment) {
		// GraphQL mutations *have* to return something
		return addCommentCommon(DaoUtils.getUserFromContext(context), reportId, comment);
	}

	private void sendNewCommentEmail(Report r, Comment comment) {
		AnetEmail email = new AnetEmail();
		NewReportCommentEmail action = new NewReportCommentEmail();
		action.setReport(r);
		action.setComment(comment);
		email.setAction(action);
		try {
			email.addToAddress(r.loadAuthor(engine.getContext()).get().getEmailAddress());
			AnetEmailWorker.sendEmailAsync(email);
		} catch (InterruptedException | ExecutionException e) {
			throw new WebApplicationException("failed to load Author", e);
		}
	}

	@GET
	@Timed
	@Path("/{id}/comments")
	public List<Comment> getCommentsForReport(@PathParam("id") int reportId) {
		//TODO: it doesn't seem to be used
		return engine.getCommentDao().getCommentsForReport(Report.createWithId(reportId));
	}

	@DELETE
	@Timed
	@Path("/{id}/comments/{commentId}")
	public Response deleteComment(@Auth Person user, @PathParam("commentId") int commentId) {
		// For now, only admins are allowed to delete a comment
		// (even though there's no action for it in the front-end).
		AuthUtils.assertAdministrator(user);
		int numRows = engine.getCommentDao().delete(commentId);
		if (numRows != 1) {
			throw new WebApplicationException("Unable to delete comment", Status.NOT_FOUND);
		}
		return Response.ok().build();
	}

	@POST
	@Timed
	@Path("/{id}/email")
	public Response emailReport(@Auth Person user, @PathParam("id") int reportId, AnetEmail email) {
		emailReportCommon(user, reportId, email);
		return Response.ok().build();
	}

	private int emailReportCommon(Person user, int reportId, AnetEmail email) {
		final Report r = dao.getById(reportId, user);
		if (r == null) { throw new WebApplicationException("Report not found", Status.NOT_FOUND); }

		ReportEmail action = new ReportEmail();
		action.setReport(Report.createWithId(reportId));
		action.setSender(user);
		action.setComment(email.getComment());
		email.setAction(action);
		AnetEmailWorker.sendEmailAsync(email);
		return 1;
	}

	@GraphQLMutation(name="emailReport")
	public Integer emailReport(@GraphQLRootContext Map<String, Object> context,
			@GraphQLArgument(name="id") int reportId,
			@GraphQLArgument(name="email") AnetEmail email) {
		// GraphQL mutations *have* to return something, we return an integer
		return emailReportCommon(DaoUtils.getUserFromContext(context), reportId, email);
	}

	/*
	 * Delete a draft report. Authors can delete DRAFT, REJECTED reports. Admins can delete any report
	 */
	@DELETE
	@Timed
	@Path("/{id}/delete")
	public Response deleteReport(@Auth Person user, @PathParam("id") int reportId) {
		deleteReportCommon(user, reportId);
		return Response.ok().build();
	}

	private int deleteReportCommon(Person user, int reportId) {
		final Report report = dao.getById(reportId, user);
		if (report == null) { throw new WebApplicationException("Report not found", Status.NOT_FOUND); }

		assertCanDeleteReport(report, user);

		return dao.deleteReport(report);
	}

	@GraphQLMutation(name="deleteReport")
	public Integer deleteReport(@GraphQLRootContext Map<String, Object> context, @GraphQLArgument(name="id") int reportId) {
		return deleteReportCommon(DaoUtils.getUserFromContext(context), reportId);
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
	public AnetBeanList<Report> search(@Auth Person user, @Context HttpServletRequest request) {
		try {
			return search(user, ResponseUtils.convertParamsToBean(request, ReportSearchQuery.class));
		} catch (IllegalArgumentException e) {
			throw new WebApplicationException(e.getMessage(), e.getCause(), Status.BAD_REQUEST);
		}
	}

	// Note: Split off from the GraphQL Query, as Jersey would otherwise complain about the @GraphQLRootContext
	@POST
	@Timed
	@Path("/search")
	public AnetBeanList<Report> search(@Auth Person user, ReportSearchQuery query) {
		return searchCommon(user, query);
	}

	@GraphQLQuery(name="reportList")
	public AnetBeanList<Report> search(@GraphQLRootContext Map<String, Object> context,
			@GraphQLArgument(name="query") ReportSearchQuery query) {
		return searchCommon(DaoUtils.getUserFromContext(context), query);
	}

	private AnetBeanList<Report> searchCommon(Person user, ReportSearchQuery query) {
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
	@GraphQLQuery(name="rollupGraph")
	@Path("/rollupGraph")
	public List<RollupGraph> getDailyRollupGraph(
			@QueryParam("startDate") @GraphQLArgument(name="startDate") Long start,
			@QueryParam("endDate") @GraphQLArgument(name="endDate") Long end,
			@QueryParam("orgType") @GraphQLArgument(name="orgType") OrganizationType orgType,
			@QueryParam("advisorOrganizationId") @GraphQLArgument(name="advisorOrganizationId") Integer advisorOrgId,
			@QueryParam("principalOrganizationId") @GraphQLArgument(name="principalOrganizationId") Integer principalOrgId) {
		DateTime startDate = new DateTime(start);
		DateTime endDate = new DateTime(end);

		final List<RollupGraph> dailyRollupGraph;

		@SuppressWarnings("unchecked")
		final List<String> nonReportingOrgsShortNames = (List<String>) config.getDictionary().get("non_reporting_ORGs");
		final Map<Integer, Organization> nonReportingOrgs = getOrgsByShortNames(nonReportingOrgsShortNames);

		if (principalOrgId != null) {
			dailyRollupGraph = dao.getDailyRollupGraph(startDate, endDate, principalOrgId, OrganizationType.PRINCIPAL_ORG, nonReportingOrgs);
		} else if (advisorOrgId != null) {
			dailyRollupGraph = dao.getDailyRollupGraph(startDate, endDate, advisorOrgId, OrganizationType.ADVISOR_ORG, nonReportingOrgs);
		} else {
			if (orgType == null) {
				orgType = OrganizationType.ADVISOR_ORG;
			}
			dailyRollupGraph = dao.getDailyRollupGraph(startDate, endDate, orgType, nonReportingOrgs);
		}

		Collections.sort(dailyRollupGraph, rollupGraphComparator);

		return dailyRollupGraph;
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
		emailRollupCommon(user, start, end, orgType,
			advisorOrgId, principalOrgId, email);
		return Response.ok().build();
	}

	public int emailRollupCommon(Person user,
			Long start, Long end, OrganizationType orgType,
			Integer advisorOrgId, Integer principalOrgId, AnetEmail email) {
		DailyRollupEmail action = new DailyRollupEmail();
		action.setStartDate(new DateTime(start));
		action.setEndDate(new DateTime(end));
		action.setComment(email.getComment());
		action.setAdvisorOrganizationId(advisorOrgId);
		action.setPrincipalOrganizationId(principalOrgId);
		action.setChartOrgType(orgType);

		email.setAction(action);
		AnetEmailWorker.sendEmailAsync(email);
		return 1;
	}

	@GraphQLMutation(name="emailRollup")
	public Integer emailRollup(@GraphQLRootContext Map<String, Object> context,
			@GraphQLArgument(name="startDate") Long start,
			@GraphQLArgument(name="endDate") Long end,
			@GraphQLArgument(name="orgType") OrganizationType orgType,
			@GraphQLArgument(name="advisorOrganizationId") Integer advisorOrgId,
			@GraphQLArgument(name="principalOrganizationId") Integer principalOrgId,
			@GraphQLArgument(name="email") AnetEmail email) {
		// GraphQL mutations *have* to return something, we return an integer
		return emailRollupCommon(DaoUtils.getUserFromContext(context), start,
			end, orgType, advisorOrgId, principalOrgId, email);
	}

	/**
	 * Generate an HTML view of the daily rollup email
	 */
	@GET
	@Timed
	@Path("/rollup")
	@Produces(MediaType.TEXT_HTML)
	public Response showRollupEmail(@QueryParam("startDate") Long start,
			@QueryParam("endDate") Long end,
			@QueryParam("orgType") OrganizationType orgType,
			@QueryParam("advisorOrganizationId") Integer advisorOrgId,
			@QueryParam("principalOrganizationId") Integer principalOrgId,
			@QueryParam("showText") @DefaultValue("false") Boolean showReportText) {
		return Response.ok(showRollupEmailCommon(start, end, orgType, advisorOrgId,
				principalOrgId, showReportText), MediaType.TEXT_HTML_TYPE).build();
	}

	@GraphQLQuery(name="showRollupEmail")
	public String showRollupEmailGraphQL(@GraphQLArgument(name="startDate") Long start,
			@GraphQLArgument(name="endDate") Long end,
			@GraphQLArgument(name="orgType") OrganizationType orgType,
			@GraphQLArgument(name="advisorOrganizationId") Integer advisorOrgId,
			@GraphQLArgument(name="principalOrganizationId") Integer principalOrgId,
			@GraphQLArgument(name="showText", defaultValue="false") Boolean showReportText) {
		return showRollupEmailCommon(start, end, orgType, advisorOrgId,
				principalOrgId, showReportText);
	}

	private String showRollupEmailCommon(Long start, Long end,
			OrganizationType orgType, Integer advisorOrgId,
			Integer principalOrgId, Boolean showReportText) {
		DailyRollupEmail action = new DailyRollupEmail();
		action.setStartDate(new DateTime(start));
		action.setEndDate(new DateTime(end));
		action.setChartOrgType(orgType);
		action.setAdvisorOrganizationId(advisorOrgId);
		action.setPrincipalOrganizationId(principalOrgId);

		Map<String,Object> context = action.execute();

		@SuppressWarnings("unchecked")
		final Map<String,Object> fields = (Map<String, Object>) config.getDictionary().get("fields");

		context.put("context", engine.getContext());
		context.put("serverUrl", config.getServerUrl());
		context.put(AdminSettingKeys.SECURITY_BANNER_TEXT.name(), engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_TEXT));
		context.put(AdminSettingKeys.SECURITY_BANNER_COLOR.name(), engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_COLOR));
		context.put(DailyRollupEmail.SHOW_REPORT_TEXT_FLAG, showReportText);
		context.put("fields", fields);

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

			return writer.toString();
		} catch (Exception e) {
			throw new WebApplicationException(e);
		}
	}

	/**
	 * Gets aggregated data per organization for engagements attended and reports submitted
	 * for each advisor in a given organization.
	 * @param weeksAgo Weeks ago integer for the amount of weeks before the current week
	 *
	 */
	@GET
	@Timed
	@GraphQLQuery(name="advisorReportInsights")
	@Path("/insights/advisors")
	@RolesAllowed("SUPER_USER")
	public List<AdvisorReportsEntry> getAdvisorReportInsights(
		@DefaultValue("3") 	@QueryParam("weeksAgo") @GraphQLArgument(name="weeksAgo", defaultValue="3") int weeksAgo,
		@DefaultValue("-1") @QueryParam("orgId") @GraphQLArgument(name="orgId", defaultValue="-1") int orgId) {

		DateTime now = DateTime.now();
		DateTime weekStart = now.withDayOfWeek(DateTimeConstants.MONDAY).withTimeAtStartOfDay();
		DateTime startDate = weekStart.minusWeeks(weeksAgo);
		final List<Map<String, Object>> list = dao.getAdvisorReportInsights(startDate, now, orgId);
		// Organization is given, group by person
		String topLevelField = "name";
		String groupCol = "personid";
		if (orgId < 0) {
			// No organization is given, group by organization, we are in the top level
			topLevelField = "organizationshortname";
			groupCol = "organizationid";
		}
		final Set<String> tlf = Stream.of(topLevelField).collect(Collectors.toSet());
		final List<Map<String, Object>> groupedResults = Utils.resultGrouper(list, "stats", groupCol, tlf);
		List<AdvisorReportsEntry> result = new LinkedList<AdvisorReportsEntry>();
		for (Map<String, Object> group : groupedResults) {
			AdvisorReportsEntry entry = new AdvisorReportsEntry();
			entry.setId((int) group.get(groupCol));
			entry.setName((String) group.get(topLevelField));
			List<AdvisorReportsStats> stats = new LinkedList<AdvisorReportsStats>();
			for (Map<String, Object> groupSt : (ArrayList<Map<String, Object>>) group.get("stats")) {
				AdvisorReportsStats st = new AdvisorReportsStats();
				st.setWeek((int) groupSt.get("week"));
				st.setNrReportsSubmitted((int) groupSt.get("nrreportssubmitted"));
				st.setNrEngagementsAttended((int) groupSt.get("nrengagementsattended"));
				stats.add(st);
			}
			entry.setStats(stats);
			result.add(entry);
		}
		return result;
	}

	private Map<Integer, Organization> getOrgsByShortNames(List<String> orgShortNames) {
		final Map<Integer, Organization> result = new HashMap<>();
		for (final Organization organization : engine.getOrganizationDao().getOrgsByShortNames(orgShortNames)) {
			result.put(organization.getId(), organization);
		}
		return result;
	}

	/**
	 * The comparator to be used when ordering the roll up graph results to ensure
	 * that any pinned organisation names are returned at the start of the list.
	 */
	public static class RollupGraphComparator implements Comparator<RollupGraph> {

		private final List<String> pinnedOrgNames;

		/**
		 * Creates an instance of this comparator using the supplied pinned organisation
		 * names.
		 *
		 * @param pinnedOrgNames
		 *            the pinned organisation names
		 */
		public RollupGraphComparator(final List<String> pinnedOrgNames) {
			this.pinnedOrgNames = pinnedOrgNames;
		}

		/**
		 * Compare the suppled objects, based on whether they are in the list of pinned
		 * org names and their short names.
		 *
		 * @param o1
		 *            the first object
		 * @param o2
		 *            the second object
		 * @return the result of the comparison.
		 */
		@Override
		public int compare(final RollupGraph o1, final RollupGraph o2) {

			int result = 0;

			if (o1.getOrg() != null && o2.getOrg() == null) {
				result = -1;
			} else if (o2.getOrg() != null && o1.getOrg() == null) {
				result = 1;
			} else if (o2.getOrg() == null && o1.getOrg() == null) {
				result = 0;
			} else if (pinnedOrgNames.contains(o1.getOrg().getShortName())) {
				if (pinnedOrgNames.contains(o2.getOrg().getShortName())) {
					result = pinnedOrgNames.indexOf(o1.getOrg().getShortName())
							- pinnedOrgNames.indexOf(o2.getOrg().getShortName());
				} else {
					result = -1;
				}
			} else if (pinnedOrgNames.contains(o2.getOrg().getShortName())) {
				result = 1;
			} else {
				final int c = o1.getOrg().getShortName().compareTo(o2.getOrg().getShortName());

				if (c != 0) {
					result = c;
				} else {
					result = o1.getOrg().getId() - o2.getOrg().getId();
				}
			}

			return result;
		}
	}
}

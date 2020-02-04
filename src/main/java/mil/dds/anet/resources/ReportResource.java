package mil.dds.anet.resources;

import freemarker.template.Configuration;
import freemarker.template.DefaultObjectWrapperBuilder;
import freemarker.template.Template;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLEnvironment;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.io.StringWriter;
import java.lang.invoke.MethodHandles;
import java.nio.charset.StandardCharsets;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
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
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Response.Status;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AdvisorReportsEntry;
import mil.dds.anet.beans.AdvisorReportsStats;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.Note;
import mil.dds.anet.beans.Note.NoteType;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Organization.OrganizationType;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Person.Role;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.ReportAction;
import mil.dds.anet.beans.ReportAction.ActionType;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.beans.RollupGraph;
import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.config.AnetConfiguration;
import mil.dds.anet.database.AdminDao.AdminSettingKeys;
import mil.dds.anet.database.NoteDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.emails.ApprovalNeededEmail;
import mil.dds.anet.emails.DailyRollupEmail;
import mil.dds.anet.emails.NewReportCommentEmail;
import mil.dds.anet.emails.ReportEditedEmail;
import mil.dds.anet.emails.ReportEmail;
import mil.dds.anet.emails.ReportRejectionEmail;
import mil.dds.anet.threads.AnetEmailWorker;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ReportResource {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final ReportDao dao;
  private final AnetObjectEngine engine;
  private final AnetConfiguration config;

  private final RollupGraphComparator rollupGraphComparator;
  private final DateTimeFormatter dtf;
  private final boolean engagementsIncludeTimeAndDuration;
  private final DateTimeFormatter edtf;

  public ReportResource(AnetObjectEngine engine, AnetConfiguration config) {
    this.engine = engine;
    this.dao = engine.getReportDao();
    this.config = config;
    this.dtf = DateTimeFormatter
        .ofPattern((String) this.config.getDictionaryEntry("dateFormats.email.date"))
        .withZone(DaoUtils.getDefaultZoneId());
    engagementsIncludeTimeAndDuration = Boolean.TRUE
        .equals((Boolean) this.config.getDictionaryEntry("engagementsIncludeTimeAndDuration"));
    final String edtfPattern = (String) this.config
        .getDictionaryEntry(engagementsIncludeTimeAndDuration ? "dateFormats.email.withTime"
            : "dateFormats.email.date");
    this.edtf = DateTimeFormatter.ofPattern(edtfPattern).withZone(DaoUtils.getDefaultZoneId());
    @SuppressWarnings("unchecked")
    List<String> pinnedOrgNames = (List<String>) this.config.getDictionaryEntry("pinned_ORGs");
    this.rollupGraphComparator = new RollupGraphComparator(pinnedOrgNames);

  }

  @GraphQLQuery(name = "report")
  public Report getByUuid(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String uuid) {
    final Report r = dao.getByUuid(uuid, DaoUtils.getUserFromContext(context));
    if (r == null) {
      throw new WebApplicationException("Report not found", Status.NOT_FOUND);
    }
    return r;
  }

  @GraphQLMutation(name = "createReport")
  public Report createReport(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "report") Report r) {
    Person author = DaoUtils.getUserFromContext(context);
    if (r.getState() == null) {
      r.setState(ReportState.DRAFT);
    }
    if (r.getAuthorUuid() == null) {
      r.setAuthorUuid(author.getUuid());
    }

    Person primaryAdvisor = findPrimaryAttendee(r, Role.ADVISOR);
    if (r.getAdvisorOrgUuid() == null && primaryAdvisor != null) {
      try {
        logger.debug("Setting advisor org for new report based on {}", primaryAdvisor);
        r.setAdvisorOrg(
            engine.getOrganizationForPerson(engine.getContext(), primaryAdvisor.getUuid()).get());
      } catch (InterruptedException | ExecutionException e) {
        throw new WebApplicationException("failed to load Organization for PrimaryAdvisor", e);
      }
    }
    Person primaryPrincipal = findPrimaryAttendee(r, Role.PRINCIPAL);
    if (r.getPrincipalOrgUuid() == null && primaryPrincipal != null) {
      try {
        logger.debug("Setting principal org for new report based on {}", primaryPrincipal);
        r.setPrincipalOrg(
            engine.getOrganizationForPerson(engine.getContext(), primaryPrincipal.getUuid()).get());
      } catch (InterruptedException | ExecutionException e) {
        throw new WebApplicationException("failed to load Organization for PrimaryPrincipal", e);
      }
    }

    r.setReportText(
        Utils.isEmptyHtml(r.getReportText()) ? null : Utils.sanitizeHtml(r.getReportText()));

    r = dao.insert(r, author);
    AnetAuditLogger.log("Report {} created by author {} ", r, author);
    return r;
  }

  @GraphQLMutation(name = "updateReport")
  public Report updateReport(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "report") Report r,
      @GraphQLArgument(name = "sendEditEmail", defaultValue = "true") boolean sendEmail) {
    Person editor = DaoUtils.getUserFromContext(context);
    // perform all modifications to the report and its tasks and steps in a single transaction,
    // returning the original state of the report
    final Report existing = executeReportUpdates(editor, r);

    if (sendEmail && existing.getState() == ReportState.PENDING_APPROVAL) {
      boolean canApprove = engine.canUserApproveStep(engine.getContext(), editor.getUuid(),
          existing.getApprovalStepUuid());
      if (canApprove) {
        AnetEmail email = new AnetEmail();
        ReportEditedEmail action = new ReportEditedEmail();
        action.setReport(existing);
        action.setEditor(editor);
        email.setAction(action);
        try {
          email.setToAddresses(Collections
              .singletonList(existing.loadAuthor(engine.getContext()).get().getEmailAddress()));
          AnetEmailWorker.sendEmailAsync(email);
        } catch (InterruptedException | ExecutionException e) {
          throw new WebApplicationException("failed to load Author", e);
        }
      }
    }

    // Return the report in the response; used in autoSave by the client form
    return r;
  }

  private Person findPrimaryAttendee(Report r, Role role) {
    if (r.getAttendees() == null) {
      return null;
    }
    return r.getAttendees().stream().filter(p -> p.isPrimary() && p.getRole().equals(role))
        .findFirst().orElse(null);
  }

  /**
   * Perform all modifications to the report and its tasks and steps, returning the original state
   * of the report. Should be wrapped in a single transaction to ensure consistency.
   * 
   * @param editor the current user (for authorization checks)
   * @param r a Report object with the desired modifications
   * @return the report as it was stored in the database before this method was called.
   */
  private Report executeReportUpdates(Person editor, Report r) {
    // Verify this person has access to edit this report
    // Either they are the author, or an approver for the current step.
    final Report existing = dao.getByUuid(r.getUuid(), editor);
    if (existing == null) {
      throw new WebApplicationException("Report not found", Status.NOT_FOUND);
    }
    // Certain properties may not be changed through an update request
    r.setState(existing.getState());
    r.setApprovalStepUuid(existing.getApprovalStepUuid());
    r.setAuthorUuid(existing.getAuthorUuid());
    assertCanUpdateReport(r, editor);

    boolean isAuthor = Objects.equals(r.getAuthorUuid(), editor.getUuid());
    // State should not change when report is being edited by an approver
    // State should change to draft when the report is being edited by its author
    if (isAuthor) {
      r.setState(ReportState.DRAFT);
      r.setApprovalStep(null);
    }

    // If there is a change to the primary advisor, change the advisor Org.
    Person primaryAdvisor = findPrimaryAttendee(r, Role.ADVISOR);
    ReportPerson exstingPrimaryAdvisor;
    try {
      exstingPrimaryAdvisor = existing.loadPrimaryAdvisor(engine.getContext()).get();
      if (Utils.uuidEqual(primaryAdvisor, exstingPrimaryAdvisor) == false
          || existing.getAdvisorOrgUuid() == null) {
        r.setAdvisorOrg(engine
            .getOrganizationForPerson(engine.getContext(), DaoUtils.getUuid(primaryAdvisor)).get());
      } else {
        r.setAdvisorOrgUuid(existing.getAdvisorOrgUuid());
      }
    } catch (InterruptedException | ExecutionException e) {
      throw new WebApplicationException("failed to load PrimaryAdvisor", e);
    }

    Person primaryPrincipal = findPrimaryAttendee(r, Role.PRINCIPAL);
    ReportPerson existingPrimaryPrincipal;
    try {
      existingPrimaryPrincipal = existing.loadPrimaryPrincipal(engine.getContext()).get();
      if (Utils.uuidEqual(primaryPrincipal, existingPrimaryPrincipal) == false
          || existing.getPrincipalOrgUuid() == null) {
        r.setPrincipalOrg(
            engine.getOrganizationForPerson(engine.getContext(), DaoUtils.getUuid(primaryPrincipal))
                .get());
      } else {
        r.setPrincipalOrgUuid(existing.getPrincipalOrgUuid());
      }
    } catch (InterruptedException | ExecutionException e) {
      throw new WebApplicationException("failed to load PrimaryPrincipal", e);
    }

    r.setReportText(
        Utils.isEmptyHtml(r.getReportText()) ? null : Utils.sanitizeHtml(r.getReportText()));

    // begin DB modifications
    final int numRows = dao.update(r, editor);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process report update", Status.NOT_FOUND);
    }

    // Update Attendees:
    if (r.getAttendees() != null) {
      try {
        // Fetch the people associated with this report
        List<ReportPerson> existingPeople =
            dao.getAttendeesForReport(engine.getContext(), r.getUuid()).get();
        // Find any differences and fix them.
        for (ReportPerson rp : r.getAttendees()) {
          Optional<ReportPerson> existingPerson =
              existingPeople.stream().filter(el -> el.getUuid().equals(rp.getUuid())).findFirst();
          if (existingPerson.isPresent()) {
            if (existingPerson.get().isPrimary() != rp.isPrimary()) {
              dao.updateAttendeeOnReport(rp, r);
            }
            existingPeople.remove(existingPerson.get());
          } else {
            dao.addAttendeeToReport(rp, r);
          }
        }
        // Any attendees left in existingPeople needs to be removed.
        for (ReportPerson rp : existingPeople) {
          dao.removeAttendeeFromReport(rp, r);
        }
      } catch (InterruptedException | ExecutionException e) {
        throw new WebApplicationException("failed to load Attendees", e);
      }
    }

    // Update Tasks:
    if (r.getTasks() != null) {
      try {
        List<Task> existingTasks = dao.getTasksForReport(engine.getContext(), r.getUuid()).get();
        List<String> existingTaskUuids =
            existingTasks.stream().map(p -> p.getUuid()).collect(Collectors.toList());
        for (Task p : r.getTasks()) {
          int idx = existingTaskUuids.indexOf(p.getUuid());
          if (idx == -1) {
            dao.addTaskToReport(p, r);
          } else {
            existingTaskUuids.remove(idx);
          }
        }
        for (String uuid : existingTaskUuids) {
          dao.removeTaskFromReport(uuid, r);
        }
      } catch (InterruptedException | ExecutionException e) {
        throw new WebApplicationException("failed to load Tasks", e);
      }
    }

    // Update Tags:
    if (r.getTags() != null) {
      try {
        List<Tag> existingTags = dao.getTagsForReport(engine.getContext(), r.getUuid()).get();
        for (final Tag t : r.getTags()) {
          Optional<Tag> existingTag =
              existingTags.stream().filter(el -> el.getUuid().equals(t.getUuid())).findFirst();
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
      final List<AuthorizationGroup> existingAuthorizationGroups =
          dao.getAuthorizationGroupsForReport(r.getUuid());
      for (final AuthorizationGroup t : r.getAuthorizationGroups()) {
        Optional<AuthorizationGroup> existingAuthorizationGroup = existingAuthorizationGroups
            .stream().filter(el -> el.getUuid().equals(t.getUuid())).findFirst();
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

    // Clear and re-load sensitive information; needed in case of autoSave by the client form, or
    // when sensitive info is 'empty' HTML
    try {
      r.setReportSensitiveInformation(null);
      r.loadReportSensitiveInformation(engine.getContext()).get();
    } catch (InterruptedException | ExecutionException e) {
      throw new WebApplicationException("failed to load ReportSensitiveInformation", e);
    }

    // Return the report in the response; used in autoSave by the client form
    return existing;
  }

  @SuppressWarnings("checkstyle:MissingSwitchDefault")
  private void assertCanUpdateReport(Report report, Person editor) {
    String permError = "You do not have permission to edit this report. ";
    boolean isAuthor = Objects.equals(report.getAuthorUuid(), editor.getUuid());
    switch (report.getState()) {
      case DRAFT:
      case REJECTED:
      case APPROVED:
      case CANCELLED:
        // Must be the author
        if (!isAuthor) {
          throw new WebApplicationException(permError + "Must be the author of this report.",
              Status.FORBIDDEN);
        }
        break;
      case PENDING_APPROVAL:
        // Must be the author or the approver
        boolean canApprove = engine.canUserApproveStep(engine.getContext(), editor.getUuid(),
            report.getApprovalStepUuid());
        if (!isAuthor && !canApprove) {
          throw new WebApplicationException(
              permError + "Must be the author of this report or the current approver.",
              Status.FORBIDDEN);
        }
        break;
      case PUBLISHED:
        AnetAuditLogger.log(
            "attempt to edit published report {} by editor {} (uuid: {}) was forbidden",
            report.getUuid(), editor.getName(), editor.getUuid());
        throw new WebApplicationException("Cannot edit a published report", Status.FORBIDDEN);
      default:
        throw new WebApplicationException("Unknown report state", Status.FORBIDDEN);
    }
  }

  @GraphQLMutation(name = "submitReport")
  public Report submitReport(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String uuid)
      throws InterruptedException, ExecutionException, Exception {
    Person user = DaoUtils.getUserFromContext(context);
    final Report r = dao.getByUuid(uuid, user);
    if (r == null) {
      throw new WebApplicationException("Report not found", Status.NOT_FOUND);
    }
    logger.debug("Attempting to submit report {}, which has advisor org {} and primary advisor {}",
        r, r.getAdvisorOrg(), r.getPrimaryAdvisor());

    // TODO: this needs to be done by either the Author, a Superuser for the AO, or an Administrator
    if (r.getAdvisorOrgUuid() == null) {
      ReportPerson advisor;
      try {
        advisor = r.loadPrimaryAdvisor(engine.getContext()).get();
        if (advisor == null) {
          throw new WebApplicationException("Report missing primary advisor", Status.BAD_REQUEST);
        }
        r.setAdvisorOrg(
            engine.getOrganizationForPerson(engine.getContext(), advisor.getUuid()).get());
      } catch (InterruptedException | ExecutionException e) {
        throw new WebApplicationException("failed to load PrimaryAdvisor", e);
      }
    }
    if (r.getPrincipalOrgUuid() == null) {
      ReportPerson principal;
      try {
        principal = r.loadPrimaryPrincipal(engine.getContext()).get();
        if (principal == null) {
          throw new WebApplicationException("Report missing primary principal", Status.BAD_REQUEST);
        }
        r.setPrincipalOrg(
            engine.getOrganizationForPerson(engine.getContext(), principal.getUuid()).get());
      } catch (InterruptedException | ExecutionException e) {
        throw new WebApplicationException("failed to load PrimaryPrincipal", e);
      }
    }

    if (r.getEngagementDate() == null) {
      throw new WebApplicationException("Missing engagement date", Status.BAD_REQUEST);
    }

    final String orgUuid;
    try {
      final Organization org =
          engine.getOrganizationForPerson(engine.getContext(), r.getAuthorUuid()).get();
      if (org == null) {
        // Author missing Org, use the Default Approval Workflow
        orgUuid = engine.getDefaultOrgUuid();
      } else {
        orgUuid = org.getUuid();
      }
    } catch (InterruptedException | ExecutionException e) {
      throw new WebApplicationException("failed to load Organization for Author", e);
    }
    List<ApprovalStep> steps = null;
    try {
      if (r.isFutureEngagement()) {
        steps = engine.getPlanningApprovalStepsForOrg(engine.getContext(), orgUuid).get();
      } else {
        steps = engine.getApprovalStepsForOrg(engine.getContext(), orgUuid).get();
        throwExceptionNoApprovalSteps(steps);
      }
    } catch (InterruptedException | ExecutionException e) {
      throw new WebApplicationException("failed to load Organization for Author", e);
    }

    // Write the submission action
    ReportAction action = new ReportAction();
    action.setReportUuid(r.getUuid());
    action.setPersonUuid(user.getUuid());
    action.setType(ActionType.SUBMIT);
    engine.getReportActionDao().insert(action);

    if (r.isFutureEngagement() && Utils.isEmptyOrNull(steps)) {
      // Future engagements for orgs without planning approval chain will be approved directly
      // Write the approval action
      ReportAction approval = new ReportAction();
      approval.setReportUuid(r.getUuid());
      approval.setPersonUuid(user.getUuid());
      approval.setType(ActionType.APPROVE);
      engine.getReportActionDao().insert(approval);
      r.setState(ReportState.APPROVED);
    } else {
      // Push the report into the first step of this workflow
      r.setApprovalStep(steps.get(0));
      r.setState(ReportState.PENDING_APPROVAL);
    }
    final int numRows = dao.update(r, user);
    if (numRows != 1) {
      throw new WebApplicationException("No records updated", Status.BAD_REQUEST);
    }

    if (!Utils.isEmptyOrNull(steps)) {
      sendApprovalNeededEmail(r);
      logger.info("Putting report {} into step {} because of org {} on author {}", r.getUuid(),
          steps.get(0).getUuid(), orgUuid, r.getAuthorUuid());
    }

    AnetAuditLogger.log("report {} submitted by author {} (uuid: {})", r.getUuid(),
        r.loadAuthor(engine.getContext()).join(), r.getAuthorUuid());
    // GraphQL mutations *have* to return something, we return the report
    return r;
  }

  /**
   * Throws a WebApplicationException when the report does not have an approval chain belonging to
   * the advisor organization.
   */
  private void throwExceptionNoApprovalSteps(List<ApprovalStep> steps) {
    if (Utils.isEmptyOrNull(steps)) {
      final String messageBody =
          "Advisor organization is missing a report approval chain. In order to have an approval chain created for the primary advisor attendee's advisor organization, please contact the ANET support team";
      throwException(messageBody);
    }
  }

  private void throwException(String messageBody) {
    final String supportEmailAddr = (String) this.config.getDictionaryEntry("SUPPORT_EMAIL_ADDR");
    final String errorMessage = Utils.isEmptyOrNull(supportEmailAddr) ? messageBody
        : String.format("%s at %s", messageBody, supportEmailAddr);
    throw new WebApplicationException(errorMessage, Status.BAD_REQUEST);
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
        .filter(a -> (a.getPersonUuid() != null) && !a.getPersonUuid().equals(r.getAuthorUuid()))
        .map(a -> {
          try {
            return a.loadPerson(engine.getContext()).get().getEmailAddress();
          } catch (InterruptedException | ExecutionException e) {
            throw new WebApplicationException("failed to load Person", e);
          }
        }).collect(Collectors.toList()));
    AnetEmailWorker.sendEmailAsync(approverEmail);
  }

  static class ReportComment {
    public String uuid;
    public Comment comment;

    public ReportComment(String uuid, Comment comment) {
      this.uuid = uuid;
      this.comment = comment;
    }
  }

  @GraphQLMutation(name = "approveReport")
  public Report approveReport(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String uuid,
      @GraphQLArgument(name = "comment") Comment comment)
      throws InterruptedException, ExecutionException, Exception {
    Person approver = DaoUtils.getUserFromContext(context);
    ReportComment reportComment = new ReportComment(uuid, comment);
    final Report r = dao.getByUuid(reportComment.uuid, approver);
    if (r == null) {
      throw new WebApplicationException("Report not found", Status.NOT_FOUND);
    }
    final ApprovalStep step = r.loadApprovalStep(engine.getContext()).join();
    if (step == null) {
      logger.info("Report UUID {} does not currently need an approval", r.getUuid());
      throw new WebApplicationException("This report is not pending approval", Status.BAD_REQUEST);
    }

    // Report author cannot approve own report, unless admin
    if (Objects.equals(r.getAuthorUuid(), approver.getUuid()) && !AuthUtils.isAdmin(approver)) {
      logger.info("Author {} cannot approve own report UUID {}", approver.getUuid(), r.getUuid());
      throw new WebApplicationException("You cannot approve your own report", Status.FORBIDDEN);
    }
    // Verify that this user can approve for this step.
    boolean canApprove =
        engine.canUserApproveStep(engine.getContext(), approver.getUuid(), step.getUuid());
    if (canApprove == false) {
      logger.info("User UUID {} cannot approve report UUID {} for step UUID {}", approver.getUuid(),
          r.getUuid(), step.getUuid());
      throw new WebApplicationException("User cannot approve report", Status.FORBIDDEN);
    }

    // Write the approval action
    ReportAction approval = new ReportAction();
    approval.setReportUuid(r.getUuid());
    approval.setStepUuid(step.getUuid());
    approval.setPersonUuid(approver.getUuid());
    approval.setType(ActionType.APPROVE);
    engine.getReportActionDao().insert(approval);

    // Update the report
    r.setApprovalStepUuid(step.getNextStepUuid());
    if (step.getNextStepUuid() == null) {
      if (r.getCancelledReason() != null) {
        // Done with cancel, move to CANCELLED and set releasedAt
        r.setState(ReportState.CANCELLED);
        r.setReleasedAt(Instant.now());
      } else {
        // Done with approvals, move to APPROVED
        r.setState(ReportState.APPROVED);
      }
    } else {
      sendApprovalNeededEmail(r);
    }
    final int numRows = dao.update(r, approver);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process report approval", Status.NOT_FOUND);
    }

    // Add the comment
    final Comment comment1 = reportComment.comment;
    if (comment1 != null && comment1.getText() != null && comment1.getText().trim().length() > 0) {
      comment1.setReportUuid(r.getUuid());
      comment1.setAuthorUuid(approver.getUuid());
      engine.getCommentDao().insert(comment1);
    }

    AnetAuditLogger.log("Report {} approved by {} (uuid: {})", r.getUuid(), approver.getName(),
        approver.getUuid());
    // GraphQL mutations *have* to return something
    return r;
  }

  @GraphQLMutation(name = "rejectReport")
  public Report rejectReport(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String uuid,
      @GraphQLArgument(name = "comment") Comment reason)
      throws InterruptedException, ExecutionException, Exception {
    Person approver = DaoUtils.getUserFromContext(context);
    ReportComment reportComment = new ReportComment(uuid, reason);
    final Report r = dao.getByUuid(reportComment.uuid, approver);
    if (r == null) {
      throw new WebApplicationException("Report not found", Status.NOT_FOUND);
    }
    ApprovalStep step = r.loadApprovalStep(engine.getContext()).join();
    // Report author cannot reject own report, unless admin
    if (Objects.equals(r.getAuthorUuid(), approver.getUuid()) && !AuthUtils.isAdmin(approver)) {
      logger.info("Author {} cannot request changes to own report UUID {}", approver.getUuid(),
          r.getUuid());
      throw new WebApplicationException("You cannot request changes to your own report",
          Status.FORBIDDEN);
    }
    // Report can be rejected when pending approval or by an admin when pending approval or in
    // approved state
    if (step == null && !((r.getState() == ReportState.APPROVED) && AuthUtils.isAdmin(approver))) {
      logger.info("Report UUID {} does not currently need an approval", r.getUuid());
      throw new WebApplicationException("This report is not pending approval", Status.BAD_REQUEST);
    } else if (step != null) {
      // Verify that this user can reject for this step.
      boolean canReject =
          engine.canUserRejectStep(engine.getContext(), approver.getUuid(), step.getUuid());
      if (canReject == false) {
        logger.info("User UUID {} cannot request changes to report UUID {} for step UUID {}",
            approver.getUuid(), r.getUuid(), step.getUuid());
        throw new WebApplicationException("User cannot request changes to report",
            Status.FORBIDDEN);
      }
    }

    // Write the rejection action
    ReportAction rejection = new ReportAction();
    rejection.setReportUuid(r.getUuid());
    if (step != null) {
      // Step is null when an approved report is being rejected by an admin
      rejection.setStepUuid(step.getUuid());
    }
    rejection.setPersonUuid(approver.getUuid());
    rejection.setType(ActionType.REJECT);
    engine.getReportActionDao().insert(rejection);

    // Update the report
    r.setApprovalStep(null);
    r.setState(ReportState.REJECTED);
    final int numRows = dao.update(r, approver);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process report change request", Status.NOT_FOUND);
    }

    // Add the comment
    final Comment reason1 = reportComment.comment;
    reason1.setReportUuid(r.getUuid());
    reason1.setAuthorUuid(approver.getUuid());
    engine.getCommentDao().insert(reason1);

    sendReportRejectEmail(r, approver, reason1);
    AnetAuditLogger.log("report {} has requested changes by {} (uuid: {})", r.getUuid(),
        approver.getName(), approver.getUuid());
    // GraphQL mutations *have* to return something
    return r;
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

  @GraphQLMutation(name = "publishReport")
  public Report publishReport(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String uuid) {
    Person user = DaoUtils.getUserFromContext(context);
    final Report r = dao.getByUuid(uuid, user);
    if (r == null) {
      throw new WebApplicationException("Report not found", Status.NOT_FOUND);
    }
    logger.debug("Attempting to publish report {}, which has advisor org {} and primary advisor {}",
        r, r.getAdvisorOrg(), r.getPrimaryAdvisor());

    // Only admin may publish a report, and only for non future engagements
    if (!AuthUtils.isAdmin(user) || r.isFutureEngagement()) {
      logger.info("User {} cannot publish report UUID {}", user.getUuid(), r.getUuid());
      throw new WebApplicationException("You cannot publish this report", Status.FORBIDDEN);
    }

    final int numRows = dao.publish(r, user);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process report publication", Status.NOT_FOUND);
    }

    AnetAuditLogger.log("report {} published by admin UUID {}", r.getUuid(), user.getUuid());
    // GraphQL mutations *have* to return something
    return r;
  }

  @GraphQLMutation(name = "addComment")
  public Comment addComment(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String reportUuid,
      @GraphQLArgument(name = "comment") Comment comment) {
    Person author = DaoUtils.getUserFromContext(context);
    comment.setReportUuid(reportUuid);
    comment.setAuthorUuid(author.getUuid());
    comment = engine.getCommentDao().insert(comment);
    if (comment == null) {
      throw new WebApplicationException("Couldn't process adding new comment");
    }
    final Report r = dao.getByUuid(reportUuid, author);
    if (r == null) {
      throw new WebApplicationException("Report not found", Status.NOT_FOUND);
    }
    sendNewCommentEmail(r, comment);
    // GraphQL mutations *have* to return something
    return comment;
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

  @GraphQLMutation(name = "emailReport")
  public Integer emailReport(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String reportUuid,
      @GraphQLArgument(name = "email") AnetEmail email) {
    Person user = DaoUtils.getUserFromContext(context);
    final Report r = dao.getByUuid(reportUuid, user);
    if (r == null) {
      throw new WebApplicationException("Report not found", Status.NOT_FOUND);
    }

    ReportEmail action = new ReportEmail();
    action.setReport(Report.createWithUuid(reportUuid));
    action.setSender(user);
    action.setComment(email.getComment());
    email.setAction(action);
    AnetEmailWorker.sendEmailAsync(email);
    // GraphQL mutations *have* to return something, we return an integer
    return 1;
  }

  @GraphQLMutation(name = "deleteReport")
  public Integer deleteReport(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String reportUuid) {
    Person user = DaoUtils.getUserFromContext(context);
    final Report report = dao.getByUuid(reportUuid, user);
    if (report == null) {
      throw new WebApplicationException("Report not found", Status.NOT_FOUND);
    }

    assertCanDeleteReport(report, user);
    AnetAuditLogger.log("report {} deleted by {} (uuid: {})", reportUuid, user.getName(),
        user.getUuid());

    return dao.delete(reportUuid);
  }

  private void assertCanDeleteReport(Report report, Person user) {
    if (AuthUtils.isAdmin(user)) {
      return;
    }

    if (report.getState() == ReportState.DRAFT || report.getState() == ReportState.REJECTED) {
      // only the author may delete these reports
      if (Objects.equals(report.getAuthorUuid(), user.getUuid())) {
        return;
      }
    }
    throw new WebApplicationException("You cannot delete this report", Status.FORBIDDEN);
  }

  @GraphQLQuery(name = "reportList")
  public AnetBeanList<Report> search(@GraphQLRootContext Map<String, Object> context,
      @GraphQLEnvironment Set<String> subFields,
      @GraphQLArgument(name = "query") ReportSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(subFields, query);
  }

  /**
   * Get the daily rollup graph.
   * 
   * @param start Start timestamp for the rollup period
   * @param end end timestamp for the rollup period
   * @param orgType If both advisorOrgUuid and principalOrgUuid are NULL then the type of
   *        organization (ADVISOR_ORG or PRINCIPAL_ORG) that the chart should filter on
   * @param advisorOrgUuid if set then the parent advisor org to create the graph off of. All
   *        reports will be by/about this org or a child org.
   * @param principalOrgUuid if set then the parent principal org to create the graph off of. All
   *        reports will be by/about this org or a child org.
   */
  @GraphQLQuery(name = "rollupGraph")
  public List<RollupGraph> getDailyRollupGraph(@GraphQLArgument(name = "startDate") Long start,
      @GraphQLArgument(name = "endDate") Long end,
      @GraphQLArgument(name = "orgType") OrganizationType orgType,
      @GraphQLArgument(name = "advisorOrganizationUuid") String advisorOrgUuid,
      @GraphQLArgument(name = "principalOrganizationUuid") String principalOrgUuid) {
    Instant startDate = Instant.ofEpochMilli(start);
    Instant endDate = Instant.ofEpochMilli(end);

    final List<RollupGraph> dailyRollupGraph;

    @SuppressWarnings("unchecked")
    final List<String> nonReportingOrgsShortNames =
        (List<String>) config.getDictionaryEntry("non_reporting_ORGs");
    final Map<String, Organization> nonReportingOrgs =
        getOrgsByShortNames(nonReportingOrgsShortNames);

    if (principalOrgUuid != null) {
      dailyRollupGraph = dao.getDailyRollupGraph(startDate, endDate, principalOrgUuid,
          OrganizationType.PRINCIPAL_ORG, nonReportingOrgs);
    } else if (advisorOrgUuid != null) {
      dailyRollupGraph = dao.getDailyRollupGraph(startDate, endDate, advisorOrgUuid,
          OrganizationType.ADVISOR_ORG, nonReportingOrgs);
    } else {
      if (orgType == null) {
        orgType = OrganizationType.ADVISOR_ORG;
      }
      dailyRollupGraph = dao.getDailyRollupGraph(startDate, endDate, orgType, nonReportingOrgs);
    }

    Collections.sort(dailyRollupGraph, rollupGraphComparator);

    return dailyRollupGraph;
  }

  @GraphQLMutation(name = "emailRollup")
  public Integer emailRollup(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "startDate") Long start, @GraphQLArgument(name = "endDate") Long end,
      @GraphQLArgument(name = "orgType") OrganizationType orgType,
      @GraphQLArgument(name = "advisorOrganizationUuid") String advisorOrgUuid,
      @GraphQLArgument(name = "principalOrganizationUuid") String principalOrgUuid,
      @GraphQLArgument(name = "email") AnetEmail email) {
    DailyRollupEmail action = new DailyRollupEmail();
    action.setStartDate(Instant.ofEpochMilli(start));
    action.setEndDate(Instant.ofEpochMilli(end));
    action.setComment(email.getComment());
    action.setAdvisorOrganizationUuid(advisorOrgUuid);
    action.setPrincipalOrganizationUuid(principalOrgUuid);
    action.setChartOrgType(orgType);

    email.setAction(action);
    AnetEmailWorker.sendEmailAsync(email);
    // GraphQL mutations *have* to return something, we return an integer
    return 1;
  }

  @GraphQLQuery(name = "showRollupEmail")
  public String showRollupEmail(@GraphQLArgument(name = "startDate") Long start,
      @GraphQLArgument(name = "endDate") Long end,
      @GraphQLArgument(name = "orgType") OrganizationType orgType,
      @GraphQLArgument(name = "advisorOrganizationUuid") String advisorOrgUuid,
      @GraphQLArgument(name = "principalOrganizationUuid") String principalOrgUuid,
      @GraphQLArgument(name = "showText", defaultValue = "false") Boolean showReportText) {
    DailyRollupEmail action = new DailyRollupEmail();
    action.setStartDate(Instant.ofEpochMilli(start));
    action.setEndDate(Instant.ofEpochMilli(end));
    action.setChartOrgType(orgType);
    action.setAdvisorOrganizationUuid(advisorOrgUuid);
    action.setPrincipalOrganizationUuid(principalOrgUuid);

    @SuppressWarnings("unchecked")
    final Map<String, Object> fields = (Map<String, Object>) config.getDictionaryEntry("fields");

    Map<String, Object> context = new HashMap<String, Object>();
    context.put("context", engine.getContext());
    context.put("serverUrl", config.getServerUrl());
    context.put(AdminSettingKeys.SECURITY_BANNER_TEXT.name(),
        engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_TEXT));
    context.put(AdminSettingKeys.SECURITY_BANNER_COLOR.name(),
        engine.getAdminSetting(AdminSettingKeys.SECURITY_BANNER_COLOR));
    context.put(DailyRollupEmail.SHOW_REPORT_TEXT_FLAG, showReportText);
    context.put("dateFormatter", dtf);
    context.put("engagementsIncludeTimeAndDuration", engagementsIncludeTimeAndDuration);
    context.put("engagementDateFormatter", edtf);
    context.put("fields", fields);

    try {
      Configuration freemarkerConfig = new Configuration(Configuration.getVersion());
      // auto-escape HTML in our .ftlh templates
      freemarkerConfig.setRecognizeStandardFileExtensions(true);
      freemarkerConfig
          .setObjectWrapper(new DefaultObjectWrapperBuilder(Configuration.getVersion()).build());
      freemarkerConfig.loadBuiltInEncodingMap();
      freemarkerConfig.setDefaultEncoding(StandardCharsets.UTF_8.name());
      freemarkerConfig.setClassForTemplateLoading(this.getClass(), "/");
      freemarkerConfig.setAPIBuiltinEnabled(true);

      Template temp = freemarkerConfig.getTemplate(action.getTemplateName());
      StringWriter writer = new StringWriter();
      temp.process(action.buildContext(context), writer);

      return writer.toString();
    } catch (Exception e) {
      throw new WebApplicationException(e);
    }
  }

  /**
   * Gets aggregated data per organization for engagements attended and reports submitted for each
   * advisor in a given organization.
   * 
   * @param weeksAgo Weeks ago integer for the amount of weeks before the current week
   */
  @GraphQLQuery(name = "advisorReportInsights")
  public List<AdvisorReportsEntry> getAdvisorReportInsights(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "weeksAgo", defaultValue = "3") int weeksAgo,
      @GraphQLArgument(name = "orgUuid",
          defaultValue = Organization.DUMMY_ORG_UUID) String orgUuid) {
    final Person user = DaoUtils.getUserFromContext(context);
    AuthUtils.assertSuperUser(user);

    Instant now = Instant.now();
    Instant weekStart = now.atZone(DaoUtils.getDefaultZoneId()).with(DayOfWeek.MONDAY).withHour(0)
        .withMinute(0).withSecond(0).withNano(0).toInstant();
    Instant startDate =
        weekStart.atZone(DaoUtils.getDefaultZoneId()).minusWeeks(weeksAgo).toInstant();
    final List<Map<String, Object>> list =
        dao.getAdvisorReportInsights(startDate, weekStart, orgUuid);

    final String groupName = "stats";
    final String topLevelField;
    final String groupCol;
    if (Organization.DUMMY_ORG_UUID.equals(orgUuid)) {
      topLevelField = "organizationShortName";
      groupCol = "organizationUuid";
    } else {
      topLevelField = "name";
      groupCol = "personUuid";
    }
    final Set<String> tlf = Stream.of(topLevelField).collect(Collectors.toSet());
    final List<Map<String, Object>> groupedResults =
        Utils.resultGrouper(list, groupName, groupCol, tlf);
    final List<AdvisorReportsEntry> result = new LinkedList<AdvisorReportsEntry>();
    for (final Map<String, Object> group : groupedResults) {
      final AdvisorReportsEntry entry = new AdvisorReportsEntry();
      entry.setUuid((String) group.get(groupCol));
      entry.setName((String) group.get(topLevelField));
      final List<AdvisorReportsStats> stats = new LinkedList<AdvisorReportsStats>();
      @SuppressWarnings("unchecked")
      final List<Map<String, Object>> groupStats = (List<Map<String, Object>>) group.get(groupName);
      for (final Map<String, Object> groupSt : groupStats) {
        AdvisorReportsStats st = new AdvisorReportsStats();
        st.setWeek(((Number) groupSt.get("week")).intValue());
        st.setNrReportsSubmitted(((Number) groupSt.get("nrReportsSubmitted")).intValue());
        st.setNrEngagementsAttended(((Number) groupSt.get("nrEngagementsAttended")).intValue());
        stats.add(st);
      }
      entry.setStats(stats);
      result.add(entry);
    }
    return result;

  }

  private Map<String, Organization> getOrgsByShortNames(List<String> orgShortNames) {
    final Map<String, Organization> result = new HashMap<>();
    for (final Organization organization : engine.getOrganizationDao()
        .getOrgsByShortNames(orgShortNames)) {
      result.put(organization.getUuid(), organization);
    }
    return result;
  }

  /**
   * The comparator to be used when ordering the roll up graph results to ensure that any pinned
   * organisation names are returned at the start of the list.
   */
  public static class RollupGraphComparator implements Comparator<RollupGraph> {

    private final List<String> pinnedOrgNames;

    /**
     * Creates an instance of this comparator using the supplied pinned organisation names.
     *
     * @param pinnedOrgNames the pinned organisation names
     */
    public RollupGraphComparator(final List<String> pinnedOrgNames) {
      this.pinnedOrgNames = pinnedOrgNames;
    }

    /**
     * Compare the suppled objects, based on whether they are in the list of pinned org names and
     * their short names.
     *
     * @param o1 the first object
     * @param o2 the second object
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
          result = o1.getOrg().getUuid().compareTo(o2.getOrg().getUuid());
        }
      }

      return result;
    }
  }

  @GraphQLMutation(name = "updateReportAssessments")
  public int updateReportAssessments(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "report") Report r,
      @GraphQLArgument(name = "assessments") List<Note> assessments) {
    final Person user = DaoUtils.getUserFromContext(context);

    for (int i = 0; i < assessments.size(); i++) {
      final Note n = assessments.get(i);
      n.setAuthorUuid(DaoUtils.getUuid(user));
    }
    final List<Note> existingNotes = r.loadNotes(engine.getContext()).join();
    final List<Note> existingAssessments = existingNotes.stream()
        .filter(n -> n.getType().equals(NoteType.ASSESSMENT)).collect(Collectors.toList());
    Utils.addRemoveElementsByUuid(existingAssessments, assessments,
        newAssessment -> engine.getNoteDao().insert(newAssessment),
        oldAssessmentUuid -> engine.getNoteDao().delete(oldAssessmentUuid));
    for (int i = 0; i < assessments.size(); i++) {
      final Note curr = assessments.get(i);
      final Note existingAssessment = Utils.getByUuid(existingAssessments, curr.getUuid());
      if (existingAssessment != null) {
        // Check for updates to assessment
        updateAssessment(curr, existingAssessment);
      }
    }
    return assessments.size();
  }

  private void updateAssessment(Note newAssessment, Note oldAssessment) {
    final AnetObjectEngine engine = AnetObjectEngine.getInstance();
    final NoteDao noteDao = engine.getNoteDao();
    if (!newAssessment.getText().equals(oldAssessment.getText())) {
      noteDao.update(newAssessment);
    }
  }
}

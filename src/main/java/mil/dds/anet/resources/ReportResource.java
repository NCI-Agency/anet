package mil.dds.anet.resources;

import static mil.dds.anet.AnetApplication.FREEMARKER_VERSION;

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
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
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
  public Report getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    final Report r = dao.getByUuid(uuid);
    if (r == null) {
      throw new WebApplicationException("Report not found", Status.NOT_FOUND);
    }
    return r;
  }

  @GraphQLMutation(name = "createReport")
  public Report createReport(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "report") Report r) {
    r.checkAndFixCustomFields();
    Person author = DaoUtils.getUserFromContext(context);
    if (r.getState() == null) {
      r.setState(ReportState.DRAFT);
    }
    if (r.getReportPeople() == null || r.getReportPeople().stream().noneMatch(p -> p.isAuthor())) {
      throw new WebApplicationException("Report must have at least one author", Status.BAD_REQUEST);
    }

    // FIXME: Eventually, also admins should no longer be allowed to create non-draft reports
    if (r.getState() != ReportState.DRAFT && !AuthUtils.isAdmin(author)) {
      throw new WebApplicationException("Can only create Draft reports", Status.BAD_REQUEST);
    }

    Person primaryAdvisor = findPrimaryAttendee(r, Role.ADVISOR);
    if (r.getAdvisorOrgUuid() == null && primaryAdvisor != null) {
      logger.debug("Setting advisor org for new report based on {}", primaryAdvisor);
      r.setAdvisorOrg(
          engine.getOrganizationForPerson(engine.getContext(), primaryAdvisor.getUuid()).join());
    }
    Person primaryPrincipal = findPrimaryAttendee(r, Role.PRINCIPAL);
    if (r.getPrincipalOrgUuid() == null && primaryPrincipal != null) {
      logger.debug("Setting principal org for new report based on {}", primaryPrincipal);
      r.setPrincipalOrg(
          engine.getOrganizationForPerson(engine.getContext(), primaryPrincipal.getUuid()).join());
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
    r.checkAndFixCustomFields();
    Person editor = DaoUtils.getUserFromContext(context);
    // perform all modifications to the report and its tasks and steps in a single transaction,
    // returning the original state of the report
    final Report existing = executeReportUpdates(editor, r);

    if (sendEmail && existing.getState() == ReportState.PENDING_APPROVAL) {
      boolean canApprove = engine.canUserApproveStep(engine.getContext(), editor.getUuid(),
          existing.getApprovalStepUuid(), existing.getAdvisorOrgUuid()).join();
      if (canApprove) {
        AnetEmail email = new AnetEmail();
        ReportEditedEmail action = new ReportEditedEmail();
        action.setReport(existing);
        action.setEditor(editor);
        email.setAction(action);
        email.setToAddresses(existing.loadAuthors(AnetObjectEngine.getInstance().getContext())
            .join().stream().map(rp -> rp.getEmailAddress()).collect(Collectors.toList()));
        AnetEmailWorker.sendEmailAsync(email);
      }
    }

    // Return the report in the response; used in autoSave by the client form
    return r;
  }

  private Person findPrimaryAttendee(Report r, Role role) {
    if (r.getReportPeople() == null) {
      return null;
    }
    return r.getReportPeople().stream()
        .filter(p -> p.isAttendee() && p.isPrimary() && role.equals(p.getRole())).findFirst()
        .orElse(null);
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
    // Either they are an author, or an approver for the current step.
    final Report existing = dao.getByUuid(r.getUuid());
    if (existing == null) {
      throw new WebApplicationException("Report not found", Status.NOT_FOUND);
    }

    if (r.getReportPeople() == null || r.getReportPeople().stream().noneMatch(p -> p.isAuthor())) {
      throw new WebApplicationException("Report must have at least one author", Status.BAD_REQUEST);
    }

    // Certain properties may not be changed through an update request
    r.setState(existing.getState());
    r.setApprovalStepUuid(existing.getApprovalStepUuid());
    // Only *existing* authors can change a report!
    final boolean isAuthor = existing.isAuthor(editor);
    assertCanUpdateReport(r, editor, isAuthor);

    // State should not change when report is being edited by an approver
    // State should change to draft when the report is being edited by one of the existing authors
    if (isAuthor) {
      r.setState(ReportState.DRAFT);
      r.setApprovalStep(null);
    }

    // If there is a change to the primary advisor, change the advisor Org.
    final Person primaryAdvisor = findPrimaryAttendee(r, Role.ADVISOR);
    final ReportPerson existingPrimaryAdvisor =
        existing.loadPrimaryAdvisor(engine.getContext()).join();
    if (Utils.uuidEqual(primaryAdvisor, existingPrimaryAdvisor) == false
        || existing.getAdvisorOrgUuid() == null) {
      r.setAdvisorOrg(engine
          .getOrganizationForPerson(engine.getContext(), DaoUtils.getUuid(primaryAdvisor)).join());
    } else {
      r.setAdvisorOrgUuid(existing.getAdvisorOrgUuid());
    }

    final Person primaryPrincipal = findPrimaryAttendee(r, Role.PRINCIPAL);
    final ReportPerson existingPrimaryPrincipal =
        existing.loadPrimaryPrincipal(engine.getContext()).join();
    if (Utils.uuidEqual(primaryPrincipal, existingPrimaryPrincipal) == false
        || existing.getPrincipalOrgUuid() == null) {
      r.setPrincipalOrg(
          engine.getOrganizationForPerson(engine.getContext(), DaoUtils.getUuid(primaryPrincipal))
              .join());
    } else {
      r.setPrincipalOrgUuid(existing.getPrincipalOrgUuid());
    }

    r.setReportText(
        Utils.isEmptyHtml(r.getReportText()) ? null : Utils.sanitizeHtml(r.getReportText()));

    // begin DB modifications
    final int numRows = dao.update(r, editor);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process report update", Status.NOT_FOUND);
    }

    // Update report people:
    if (r.getReportPeople() != null) {
      // Fetch the people associated with this report
      final List<ReportPerson> existingPeople =
          dao.getPeopleForReport(engine.getContext(), r.getUuid()).join();
      // Find any differences and fix them.
      for (ReportPerson rp : r.getReportPeople()) {
        Optional<ReportPerson> existingPerson =
            existingPeople.stream().filter(el -> el.getUuid().equals(rp.getUuid())).findFirst();
        if (existingPerson.isPresent()) {
          if (existingPerson.get().isPrimary() != rp.isPrimary()
              || existingPerson.get().isAttendee() != rp.isAttendee()
              || existingPerson.get().isAuthor() != rp.isAuthor()) {
            dao.updatePersonOnReport(rp, r);
          }
          existingPeople.remove(existingPerson.get());
        } else {
          dao.addPersonToReport(rp, r);
        }
      }
      // Any report people left in existingPeople needs to be removed.
      for (ReportPerson rp : existingPeople) {
        dao.removePersonFromReport(rp, r);
      }
    }

    // Update Tasks:
    if (r.getTasks() != null) {
      final List<Task> existingTasks =
          dao.getTasksForReport(engine.getContext(), r.getUuid()).join();
      final List<String> existingTaskUuids =
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
    }

    // Update Tags:
    if (r.getTags() != null) {
      final List<Tag> existingTags = dao.getTagsForReport(engine.getContext(), r.getUuid()).join();
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
    r.setReportSensitiveInformation(null);
    r.loadReportSensitiveInformation(engine.getContext()).join();

    // Return the report in the response; used in autoSave by the client form
    return existing;
  }

  @SuppressWarnings("checkstyle:MissingSwitchDefault")
  private void assertCanUpdateReport(Report report, Person editor, boolean isAuthor) {
    String permError = "You do not have permission to edit this report. ";
    switch (report.getState()) {
      case DRAFT:
      case REJECTED:
      case APPROVED:
      case CANCELLED:
        // Must be an author
        if (!isAuthor) {
          throw new WebApplicationException(permError + "Must be an author of this report.",
              Status.FORBIDDEN);
        }
        break;
      case PENDING_APPROVAL:
        // Must be an author or the approver
        boolean canApprove = engine.canUserApproveStep(engine.getContext(), editor.getUuid(),
            report.getApprovalStepUuid(), report.getAdvisorOrgUuid()).join();
        if (!isAuthor && !canApprove) {
          throw new WebApplicationException(
              permError + "Must be an author of this report or a current approver.",
              Status.FORBIDDEN);
        }
        break;
      case PUBLISHED:
        AnetAuditLogger.log("attempt to edit published report {} by editor {} was forbidden",
            report.getUuid(), editor);
        throw new WebApplicationException("Cannot edit a published report", Status.FORBIDDEN);
      default:
        throw new WebApplicationException("Unknown report state", Status.FORBIDDEN);
    }
  }

  @GraphQLMutation(name = "submitReport")
  public Report submitReport(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String uuid) {
    Person user = DaoUtils.getUserFromContext(context);
    final Report r = dao.getByUuid(uuid);
    if (r == null) {
      throw new WebApplicationException("Report not found", Status.NOT_FOUND);
    }
    logger.debug("Attempting to submit report {}, which has advisor org {} and primary advisor {}",
        r, r.getAdvisorOrg(), r.getPrimaryAdvisor());

    final boolean isAuthor = r.isAuthor(user);
    if (!isAuthor && !AuthUtils.isSuperUserForOrg(user, r.getAdvisorOrgUuid(), true)
        && !AuthUtils.isAdmin(user)) {
      throw new WebApplicationException(
          "Cannot submit report unless you are a report's author, his/her super user or an admin",
          Status.FORBIDDEN);
    }

    if (r.getState() != ReportState.DRAFT && r.getState() != ReportState.REJECTED) {
      throw new WebApplicationException(
          "Cannot submit report unless it is either Draft or Rejected", Status.BAD_REQUEST);
    }

    if (r.getAdvisorOrgUuid() == null) {
      final ReportPerson advisor = r.loadPrimaryAdvisor(engine.getContext()).join();
      if (advisor == null) {
        throw new WebApplicationException("Report missing primary advisor", Status.BAD_REQUEST);
      }
      r.setAdvisorOrg(
          engine.getOrganizationForPerson(engine.getContext(), advisor.getUuid()).join());
    }
    if (r.getPrincipalOrgUuid() == null) {
      final ReportPerson principal = r.loadPrimaryPrincipal(engine.getContext()).join();
      if (principal == null) {
        throw new WebApplicationException("Report missing primary principal", Status.BAD_REQUEST);
      }
      r.setPrincipalOrg(
          engine.getOrganizationForPerson(engine.getContext(), principal.getUuid()).join());
    }

    if (r.getEngagementDate() == null) {
      throw new WebApplicationException("Missing engagement date", Status.BAD_REQUEST);
    }

    // Get all the approval steps for this report
    final List<ApprovalStep> steps = r.computeApprovalSteps(engine.getContext(), engine).join();

    // Write the submission action
    final ReportAction action = new ReportAction();
    action.setReportUuid(r.getUuid());
    action.setPersonUuid(user.getUuid());
    action.setType(ActionType.SUBMIT);
    engine.getReportActionDao().insert(action);

    if (r.isFutureEngagement() && Utils.isEmptyOrNull(steps)) {
      // Future engagements without planning approval chain will be approved directly
      // Write the approval action
      final ReportAction approval = new ReportAction();
      approval.setReportUuid(r.getUuid());
      approval.setPersonUuid(user.getUuid());
      approval.setType(ActionType.APPROVE);
      approval.setPlanned(true); // so the FutureEngagementWorker can find this
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
      dao.sendApprovalNeededEmail(r, steps.get(0));
      logger.info("Putting report {} into step {}", r.getUuid(), steps.get(0).getUuid());
    }

    AnetAuditLogger.log("report {} submitted by author {}", r.getUuid(), user.getUuid());
    // GraphQL mutations *have* to return something, we return the report
    return r;
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
      @GraphQLArgument(name = "comment") Comment comment) {
    Person approver = DaoUtils.getUserFromContext(context);
    ReportComment reportComment = new ReportComment(uuid, comment);
    final Report r = dao.getByUuid(reportComment.uuid);
    if (r == null) {
      throw new WebApplicationException("Report not found", Status.NOT_FOUND);
    }
    final ApprovalStep step = r.loadApprovalStep(engine.getContext()).join();
    if (step == null) {
      logger.info("Report UUID {} does not currently need an approval", r.getUuid());
      throw new WebApplicationException("This report is not pending approval", Status.BAD_REQUEST);
    }

    // Verify that this user can approve for this step.
    final boolean canApprove = engine
        .canUserApproveStep(engine.getContext(), approver.getUuid(), step, r.getAdvisorOrgUuid())
        .join();
    if (!canApprove) {
      logger.info("User {} cannot approve report UUID {} for step UUID {}", approver, r.getUuid(),
          step.getUuid());
      throw new WebApplicationException("User cannot approve report", Status.FORBIDDEN);
    }

    final int numRows = dao.approve(r, approver, step);
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

    AnetAuditLogger.log("Report {} approved by {}", r.getUuid(), approver);
    // GraphQL mutations *have* to return something
    return r;
  }

  @GraphQLMutation(name = "rejectReport")
  public Report rejectReport(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String uuid,
      @GraphQLArgument(name = "comment") Comment reason) {
    Person approver = DaoUtils.getUserFromContext(context);
    ReportComment reportComment = new ReportComment(uuid, reason);
    final Report r = dao.getByUuid(reportComment.uuid);
    if (r == null) {
      throw new WebApplicationException("Report not found", Status.NOT_FOUND);
    }
    ApprovalStep step = r.loadApprovalStep(engine.getContext()).join();
    // Report can be rejected when pending approval or by an admin when pending approval or in
    // approved state
    if (step == null && !((r.getState() == ReportState.APPROVED) && AuthUtils.isAdmin(approver))) {
      logger.info("Report UUID {} does not currently need an approval", r.getUuid());
      throw new WebApplicationException("This report is not pending approval", Status.BAD_REQUEST);
    } else if (step != null) {
      // Verify that this user can reject for this step.
      final boolean canReject = engine
          .canUserRejectStep(engine.getContext(), approver.getUuid(), step, r.getAdvisorOrgUuid())
          .join();
      if (!canReject) {
        logger.info("User {} cannot request changes to report UUID {} for step UUID {}", approver,
            r.getUuid(), step.getUuid());
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
    AnetAuditLogger.log("report {} has requested changes by {}", r.getUuid(), approver);
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
    email.setToAddresses(r.loadAuthors(AnetObjectEngine.getInstance().getContext()).join().stream()
        .map(rp -> rp.getEmailAddress()).collect(Collectors.toList()));
    AnetEmailWorker.sendEmailAsync(email);
  }

  @GraphQLMutation(name = "publishReport")
  public Report publishReport(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String uuid) {
    Person user = DaoUtils.getUserFromContext(context);
    final Report r = dao.getByUuid(uuid);
    if (r == null) {
      throw new WebApplicationException("Report not found", Status.NOT_FOUND);
    }
    logger.debug("Attempting to publish report {}, which has advisor org {} and primary advisor {}",
        r, r.getAdvisorOrg(), r.getPrimaryAdvisor());

    // Only admin may publish a report, and only for non future engagements
    if (!AuthUtils.isAdmin(user) || r.isFutureEngagement()) {
      logger.info("User {} cannot publish report UUID {}", user, r.getUuid());
      throw new WebApplicationException("You cannot publish this report", Status.FORBIDDEN);
    }

    final int numRows = dao.publish(r, user);
    if (numRows == 0) {
      throw new WebApplicationException("Couldn't process report publication", Status.NOT_FOUND);
    }

    AnetAuditLogger.log("report {} published by admin {}", r.getUuid(), user);
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
    final Report r = dao.getByUuid(reportUuid);
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
    email.setToAddresses(r.loadAuthors(AnetObjectEngine.getInstance().getContext()).join().stream()
        .map(rp -> rp.getEmailAddress()).collect(Collectors.toList()));
    AnetEmailWorker.sendEmailAsync(email);
  }

  @GraphQLMutation(name = "emailReport")
  public Integer emailReport(@GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "uuid") String reportUuid,
      @GraphQLArgument(name = "email") AnetEmail email) {
    Person user = DaoUtils.getUserFromContext(context);
    final Report r = dao.getByUuid(reportUuid);
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
    final Report report = dao.getByUuid(reportUuid);
    if (report == null) {
      throw new WebApplicationException("Report not found", Status.NOT_FOUND);
    }

    assertCanDeleteReport(report, user);
    AnetAuditLogger.log("report {} deleted by {}", reportUuid, user);

    return dao.delete(reportUuid);
  }

  private void assertCanDeleteReport(Report report, Person user) {
    if (AuthUtils.isAdmin(user)) {
      return;
    }

    if (report.getState() == ReportState.DRAFT || report.getState() == ReportState.REJECTED) {
      // only an author may delete these reports
      if (report.isAuthor(user)) {
        return;
      }
    }
    throw new WebApplicationException("You cannot delete this report", Status.FORBIDDEN);
  }

  @GraphQLQuery(name = "reportList")
  public CompletableFuture<AnetBeanList<Report>> search(
      @GraphQLRootContext Map<String, Object> context, @GraphQLEnvironment Set<String> subFields,
      @GraphQLArgument(name = "query") ReportSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return dao.search(context, subFields, query);
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
  public Integer emailRollup(@GraphQLArgument(name = "startDate") Long start,
      @GraphQLArgument(name = "endDate") Long end,
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
      Configuration freemarkerConfig = new Configuration(FREEMARKER_VERSION);
      // auto-escape HTML in our .ftlh templates
      freemarkerConfig.setRecognizeStandardFileExtensions(true);
      freemarkerConfig
          .setObjectWrapper(new DefaultObjectWrapperBuilder(FREEMARKER_VERSION).build());
      freemarkerConfig.loadBuiltInEncodingMap();
      freemarkerConfig.setDefaultEncoding(StandardCharsets.UTF_8.name());
      freemarkerConfig.setClassForTemplateLoading(this.getClass(), "/");
      freemarkerConfig.setAPIBuiltinEnabled(true);

      Template temp = freemarkerConfig.getTemplate(action.getTemplateName());
      StringWriter writer = new StringWriter();
      // scan:ignore — false positive, we know which template we are processing
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

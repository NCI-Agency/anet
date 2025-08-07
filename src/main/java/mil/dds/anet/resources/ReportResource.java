package mil.dds.anet.resources;

import freemarker.template.Template;
import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLEnvironment;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import io.leangen.graphql.execution.ResolutionEnvironment;
import io.leangen.graphql.spqr.spring.annotations.GraphQLApi;
import java.io.StringWriter;
import java.lang.invoke.MethodHandles;
import java.time.DayOfWeek;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AdvisorReportsEntry;
import mil.dds.anet.beans.AdvisorReportsStats;
import mil.dds.anet.beans.AnetEmail;
import mil.dds.anet.beans.ApprovalStep;
import mil.dds.anet.beans.Assessment;
import mil.dds.anet.beans.Comment;
import mil.dds.anet.beans.ConfidentialityRecord;
import mil.dds.anet.beans.GenericRelatedObject;
import mil.dds.anet.beans.Organization;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.Report.ReportState;
import mil.dds.anet.beans.ReportAction;
import mil.dds.anet.beans.ReportAction.ActionType;
import mil.dds.anet.beans.ReportPerson;
import mil.dds.anet.beans.RollupGraph;
import mil.dds.anet.beans.RollupGraph.RollupGraphType;
import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.config.AnetConfig;
import mil.dds.anet.config.AnetDictionary;
import mil.dds.anet.config.ApplicationContextProvider;
import mil.dds.anet.database.AdminDao;
import mil.dds.anet.database.AssessmentDao;
import mil.dds.anet.database.AssessmentDao.UpdateType;
import mil.dds.anet.database.CommentDao;
import mil.dds.anet.database.OrganizationDao;
import mil.dds.anet.database.PersonDao;
import mil.dds.anet.database.ReportActionDao;
import mil.dds.anet.database.ReportDao;
import mil.dds.anet.database.TaskDao;
import mil.dds.anet.emails.DailyRollupEmail;
import mil.dds.anet.emails.NewReportCommentEmail;
import mil.dds.anet.emails.ReportEditedEmail;
import mil.dds.anet.emails.ReportEmail;
import mil.dds.anet.emails.ReportRejectionEmail;
import mil.dds.anet.threads.AnetEmailWorker;
import mil.dds.anet.utils.AnetAuditLogger;
import mil.dds.anet.utils.AuthUtils;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.ResourceUtils;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractCustomizableAnetBean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@GraphQLApi
public class ReportResource {

  private static final Logger logger =
      LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

  private final AnetConfig config;
  private final AnetDictionary dict;
  private final AnetObjectEngine engine;
  private final AdminDao adminDao;
  private final CommentDao commentDao;
  private final AssessmentDao assessmentDao;
  private final OrganizationDao organizationDao;
  private final ReportDao reportDao;
  private final ReportActionDao reportActionDao;

  public ReportResource(AnetConfig config, AnetDictionary dict, AnetObjectEngine anetObjectEngine,
      AdminDao adminDao, CommentDao commentDao, AssessmentDao assessmentDao,
      OrganizationDao organizationDao, ReportDao reportDao, ReportActionDao reportActionDao) {
    this.config = config;
    this.dict = dict;
    this.engine = anetObjectEngine;
    this.adminDao = adminDao;
    this.commentDao = commentDao;
    this.assessmentDao = assessmentDao;
    this.organizationDao = organizationDao;
    this.reportDao = reportDao;
    this.reportActionDao = reportActionDao;
  }

  public static boolean hasPermission(final Person user, final String reportUuid) {
    final AnetObjectEngine anetObjectEngine = ApplicationContextProvider.getEngine();
    final ReportDao reportDao = anetObjectEngine.getReportDao();
    final Report report = reportDao.getByUuid(reportUuid);
    if (report == null) {
      return false;
    }

    if (AuthUtils.isAdmin(user)) {
      // Admins can do *anything*
      return true;
    }
    boolean isAuthor = report.isAuthor(user);
    return switch (report.getState()) {
      case DRAFT, REJECTED, APPROVED, CANCELLED ->
        // Must be an author
        isAuthor;
      case PENDING_APPROVAL ->
        // Must be an author or an approver
        isAuthor || anetObjectEngine.canUserApproveStep(anetObjectEngine.getContext(),
            user.getUuid(), report.getApprovalStepUuid(), report.getAdvisorOrgUuid()).join();
      case PUBLISHED ->
        // Must be admin
        false;
      default -> false;
    };
  }

  @GraphQLQuery(name = "report")
  public Report getByUuid(@GraphQLArgument(name = "uuid") String uuid) {
    final Report r = reportDao.getByUuid(uuid);
    if (r == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found");
    }
    return r;
  }

  @GraphQLMutation(name = "createReport")
  public Report createReport(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "report") Report r) {
    r.checkAndFixCustomFields();
    final Person author = DaoUtils.getUserFromContext(context);
    if (r.getState() == null) {
      r.setState(ReportState.DRAFT);
    }
    if (r.getReportPeople() == null
        || r.getReportPeople().stream().noneMatch(ReportPerson::isAuthor)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Report must have at least one author");
    }

    // FIXME: Eventually, also admins should no longer be allowed to create non-draft reports
    if (r.getState() != ReportState.DRAFT && !AuthUtils.isAdmin(author)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Can only create Draft reports");
    }
    if (r.getState() != ReportState.PUBLISHED && r.getState() != ReportState.CANCELLED) {
      // Clear release date
      r.setReleasedAt(null);
    } else if (r.getReleasedAt() == null) {
      // Set release date
      r.setReleasedAt(Instant.now());
    } // else keep the release date passed in by the admin

    ResourceUtils.assertAllowedClassification(r.getClassification());

    // Set advisor org
    Person primaryAdvisor = findPrimaryAttendee(r, false);
    logger.debug("Setting advisor org for new report {} based on {} at date {}", r, primaryAdvisor,
        r.getEngagementDate());
    r.setAdvisorOrg(organizationDao.getOrganizationForPerson(engine.getContext(),
        DaoUtils.getUuid(primaryAdvisor), r.getEngagementDate()).join());

    // Set interlocutor org
    Person primaryInterlocutor = findPrimaryAttendee(r, true);
    logger.debug("Setting interlocutor org for new report {} based on {} at date {}", r,
        primaryInterlocutor, r.getEngagementDate());
    r.setInterlocutorOrg(organizationDao.getOrganizationForPerson(engine.getContext(),
        DaoUtils.getUuid(primaryInterlocutor), r.getEngagementDate()).join());

    r.setReportText(
        Utils.isEmptyHtml(r.getReportText()) ? null : Utils.sanitizeHtml(r.getReportText()));

    final Report created = reportDao.insert(r, author);

    DaoUtils.saveCustomSensitiveInformation(author, ReportDao.TABLE_NAME, created.getUuid(),
        r.customSensitiveInformationKey(), r.getCustomSensitiveInformation());

    AnetAuditLogger.log("Report {} created by author {} ", created, author);
    return created;
  }

  @GraphQLMutation(name = "updateReport")
  public Report updateReport(@GraphQLRootContext GraphQLContext context,
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
        ReportEditedEmail action = new ReportEditedEmail();
        action.setReport(existing);
        action.setEditor(editor);
        ReportDao.sendEmailToReportAuthors(action, existing);
      }
    }

    // Return the report in the response; used in autoSave by the client form
    return r;
  }

  private Person findPrimaryAttendee(Report r, boolean isInterlocutor) {
    if (r.getReportPeople() == null) {
      return null;
    }
    return r.getReportPeople().stream()
        .filter(p -> p.isAttendee() && p.isPrimary() && p.isInterlocutor() == isInterlocutor)
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
    // Either they are an author, or an approver for the current step.
    final Report existing = reportDao.getByUuid(r.getUuid());
    if (existing == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found");
    }

    if (r.getReportPeople() == null
        || r.getReportPeople().stream().noneMatch(ReportPerson::isAuthor)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Report must have at least one author");
    }

    // Certain properties may not be changed through an update request
    r.setState(existing.getState());
    r.setApprovalStepUuid(existing.getApprovalStepUuid());
    // Only *existing* authors can change a report!
    final boolean isAuthor = existing.isAuthor(editor);
    assertCanUpdateReport(r, editor, isAuthor);
    ResourceUtils.assertAllowedClassification(r.getClassification());

    // State should not change when report is being edited by an approver
    // State should change to draft when the report is being edited by one of the existing authors,
    // except when the editor is admin and is editing their own published report
    if (isAuthor) {
      if (AuthUtils.isAdmin(editor)
          && (r.getState() == ReportState.PUBLISHED || r.getState() == ReportState.CANCELLED)) {
        // Keep the existing release date
        r.setReleasedAt(existing.getReleasedAt());
      } else {
        // Set back to draft
        r.setState(ReportState.DRAFT);
        r.setApprovalStep(null);
        // Clear release date
        r.setReleasedAt(null);
      }
    }

    // Update the advisor org
    final Person primaryAdvisor = findPrimaryAttendee(r, false);
    logger.debug("Updating advisor org for report {} based on {} at date {}", r, primaryAdvisor,
        r.getEngagementDate());
    r.setAdvisorOrg(organizationDao.getOrganizationForPerson(engine.getContext(),
        DaoUtils.getUuid(primaryAdvisor), r.getEngagementDate()).join());

    // Update the interlocutor org
    final Person primaryInterlocutor = findPrimaryAttendee(r, true);
    logger.debug("Updating interlocutor org for report {} based on {} at date {}", r,
        primaryInterlocutor, r.getEngagementDate());
    r.setInterlocutorOrg(organizationDao.getOrganizationForPerson(engine.getContext(),
        DaoUtils.getUuid(primaryInterlocutor), r.getEngagementDate()).join());

    r.setReportText(
        Utils.isEmptyHtml(r.getReportText()) ? null : Utils.sanitizeHtml(r.getReportText()));

    // begin DB modifications
    final int numRows = reportDao.update(r, editor);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process report update");
    }

    // Update report people:
    if (r.getReportPeople() != null) {
      // Fetch the people associated with this report
      final List<ReportPerson> existingPeople =
          reportDao.getPeopleForReport(engine.getContext(), r.getUuid()).join();
      // Find any differences and fix them.
      for (ReportPerson rp : r.getReportPeople()) {
        Optional<ReportPerson> existingPerson =
            existingPeople.stream().filter(el -> el.getUuid().equals(rp.getUuid())).findFirst();
        if (existingPerson.isPresent()) {
          if (existingPerson.get().isPrimary() != rp.isPrimary()
              || existingPerson.get().isAttendee() != rp.isAttendee()
              || existingPerson.get().isAuthor() != rp.isAuthor()
              || existingPerson.get().isInterlocutor() != rp.isInterlocutor()) {
            reportDao.updatePersonOnReport(rp, r);
          }
          existingPeople.remove(existingPerson.get());
        } else {
          reportDao.addPersonToReport(rp, r);
        }
      }
      // Any report people left in existingPeople needs to be removed.
      for (ReportPerson rp : existingPeople) {
        reportDao.removePersonFromReport(rp, r);
      }
    }

    // Update Tasks:
    if (r.getTasks() != null) {
      final List<Task> existingTasks =
          reportDao.getTasksForReport(engine.getContext(), r.getUuid()).join();
      Utils.addRemoveElementsByUuid(existingTasks, r.getTasks(),
          newTask -> reportDao.addTaskToReport(newTask, r),
          oldTask -> reportDao.removeTaskFromReport(DaoUtils.getUuid(oldTask), r));
    }

    // Update AuthorizedMembers:
    if (r.getAuthorizedMembers() != null) {
      logger.debug("Editing authorized members for {}", r);
      final List<GenericRelatedObject> existingAuthorizedMembers =
          existing.loadAuthorizedMembers(engine.getContext()).join();
      Utils.updateElementsByKey(existingAuthorizedMembers, r.getAuthorizedMembers(),
          GenericRelatedObject::getRelatedObjectUuid, newRelatedObject -> {
            final List<GenericRelatedObject> newRelatedObjects = List.of(newRelatedObject);
            reportDao.insertReportAuthorizedMembers(DaoUtils.getUuid(r), newRelatedObjects);
          }, oldRelatedObject -> {
            final List<GenericRelatedObject> oldRelatedObjects = List.of(oldRelatedObject);
            reportDao.deleteReportAuthorizedMembers(DaoUtils.getUuid(r), oldRelatedObjects);
          }, null);
    }

    DaoUtils.saveCustomSensitiveInformation(editor, ReportDao.TABLE_NAME, r.getUuid(),
        r.customSensitiveInformationKey(), r.getCustomSensitiveInformation());

    // Return the report in the response; used in autoSave by the client form
    return existing;
  }

  @SuppressWarnings("checkstyle:MissingSwitchDefault")
  private void assertCanUpdateReport(Report report, Person editor, boolean isAuthor) {
    if (AuthUtils.isAdmin(editor)) {
      // Admins can do *anything*
      return;
    }
    final String permError = "You do not have permission to edit this report. ";
    switch (report.getState()) {
      case DRAFT, REJECTED, APPROVED, CANCELLED:
        // Must be an author
        if (!isAuthor) {
          throw new ResponseStatusException(HttpStatus.FORBIDDEN,
              permError + "Must be an author of this report.");
        }
        break;
      case PENDING_APPROVAL:
        // Must be an author or the approver
        final boolean canApprove = engine.canUserApproveStep(engine.getContext(), editor.getUuid(),
            report.getApprovalStepUuid(), report.getAdvisorOrgUuid()).join();
        if (!isAuthor && !canApprove) {
          throw new ResponseStatusException(HttpStatus.FORBIDDEN,
              permError + "Must be an author of this report or a current approver.");
        }
        break;
      case PUBLISHED:
        // Must be an admin
        AnetAuditLogger.log("attempt to edit published report {} by editor {} was forbidden",
            report.getUuid(), editor);
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot edit a published report");
      default:
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unknown report state");
    }
  }

  @GraphQLMutation(name = "submitReport")
  public int submitReport(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "uuid") String uuid) {
    Person user = DaoUtils.getUserFromContext(context);
    final Report r = reportDao.getByUuid(uuid);
    if (r == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found");
    }
    logger.debug("Attempting to submit report {}, which has advisor org {} and primary advisor {}",
        r, r.getAdvisorOrg(), r.getPrimaryAdvisor());

    final boolean isAuthor = r.isAuthor(user);
    if (!isAuthor && !AuthUtils.isAdmin(user)) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN,
          "Cannot submit report unless you are a report's author, or an admin");
    }

    if (r.getState() != ReportState.DRAFT && r.getState() != ReportState.REJECTED) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Cannot submit report unless it is either Draft or Rejected");
    }

    // Update advisor org
    final ReportPerson advisor = r.loadPrimaryAdvisor(engine.getContext()).join();
    final Boolean optionalPrimaryAdvisor =
        (Boolean) dict.getDictionaryEntry("fields.report.reportPeople.optionalPrimaryAdvisor");
    if (advisor == null && !Boolean.TRUE.equals(optionalPrimaryAdvisor)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Report missing primary advisor");
    }
    logger.debug("Updating advisor org for report {} based on {} at date {}", r, advisor,
        r.getEngagementDate());
    r.setAdvisorOrg(organizationDao.getOrganizationForPerson(engine.getContext(),
        DaoUtils.getUuid(advisor), r.getEngagementDate()).join());

    // Update interlocutor org
    final ReportPerson interlocutor = r.loadPrimaryInterlocutor(engine.getContext()).join();
    final Boolean optionalPrimaryInterlocutor =
        (Boolean) dict.getDictionaryEntry("fields.report.reportPeople.optionalPrimaryPrincipal");
    if (interlocutor == null && !Boolean.TRUE.equals(optionalPrimaryInterlocutor)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "Report missing primary interlocutor");
    }
    logger.debug("Updating interlocutor org for report {} based on {} at date {}", r, interlocutor,
        r.getEngagementDate());
    r.setInterlocutorOrg(organizationDao.getOrganizationForPerson(engine.getContext(),
        DaoUtils.getUuid(interlocutor), r.getEngagementDate()).join());

    if (r.getEngagementDate() == null) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing engagement date");
    }

    final int numRows = reportDao.submit(r, user);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No records updated");
    }

    AnetAuditLogger.log("report {} submitted by author {}", r.getUuid(), user.getUuid());
    // GraphQL mutations *have* to return something, we return the report
    return numRows;
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
  public int approveReport(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "uuid") String uuid,
      @GraphQLArgument(name = "comment") Comment comment) {
    Person approver = DaoUtils.getUserFromContext(context);
    ReportComment reportComment = new ReportComment(uuid, comment);
    final Report r = reportDao.getByUuid(reportComment.uuid);
    if (r == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found");
    }
    final ApprovalStep step = r.loadApprovalStep(engine.getContext()).join();
    if (step == null) {
      logger.info("Report UUID {} does not currently need an approval", r.getUuid());
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "This report is not pending approval");
    }

    // Verify that this user can approve for this step.
    final boolean canApprove = AuthUtils.isAdmin(approver) || engine
        .canUserApproveStep(engine.getContext(), approver.getUuid(), step, r.getAdvisorOrgUuid())
        .join();
    if (!canApprove) {
      logger.info("User {} cannot approve report UUID {} for step UUID {}", approver, r.getUuid(),
          step.getUuid());
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User cannot approve report");
    }

    final int numRows = reportDao.approve(r, approver, step);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Couldn't process report approval");
    }

    // Add the comment
    final Comment comment1 = reportComment.comment;
    if (comment1 != null && comment1.getText() != null && !comment1.getText().trim().isEmpty()) {
      comment1.setReportUuid(r.getUuid());
      comment1.setAuthorUuid(approver.getUuid());
      commentDao.insert(comment1);
    }

    AnetAuditLogger.log("Report {} approved by {}", r.getUuid(), approver);
    // GraphQL mutations *have* to return something
    return numRows;
  }

  @GraphQLMutation(name = "rejectReport")
  public int rejectReport(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "uuid") String uuid,
      @GraphQLArgument(name = "comment") Comment reason) {
    Person approver = DaoUtils.getUserFromContext(context);
    ReportComment reportComment = new ReportComment(uuid, reason);
    final Report r = reportDao.getByUuid(reportComment.uuid);
    if (r == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found");
    }
    ApprovalStep step = r.loadApprovalStep(engine.getContext()).join();
    // Report can be rejected when pending approval or by an admin when pending approval or in
    // approved state
    if (step == null && !((r.getState() == ReportState.APPROVED) && AuthUtils.isAdmin(approver))) {
      logger.info("Report UUID {} does not currently need an approval", r.getUuid());
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
          "This report is not pending approval");
    } else if (step != null) {
      // Verify that this user can reject for this step.
      final boolean canReject = engine
          .canUserRejectStep(engine.getContext(), approver.getUuid(), step, r.getAdvisorOrgUuid())
          .join();
      if (!canReject) {
        logger.info("User {} cannot request changes to report UUID {} for step UUID {}", approver,
            r.getUuid(), step.getUuid());
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
            "User cannot request changes to report");
      }
    }

    // Write the rejection action
    final ReportAction rejection = new ReportAction();
    rejection.setReportUuid(r.getUuid());
    if (step != null) {
      // Step is null when an approved report is being rejected by an admin
      rejection.setStepUuid(step.getUuid());
    }
    rejection.setPersonUuid(approver.getUuid());
    rejection.setType(ActionType.REJECT);
    rejection.setPlanned(ApprovalStep.isPlanningStep(step) || r.isFutureEngagement());
    reportActionDao.insert(rejection);

    // Update the report
    r.setApprovalStep(null);
    r.setState(ReportState.REJECTED);
    // Clear release date
    r.setReleasedAt(null);
    final int numRows = reportDao.update(r, approver);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Couldn't process report change request");
    }

    // Add the comment
    final Comment reason1 = reportComment.comment;
    reason1.setReportUuid(r.getUuid());
    reason1.setAuthorUuid(approver.getUuid());
    commentDao.insert(reason1);

    sendReportRejectEmail(r, approver, reason1);
    AnetAuditLogger.log("report {} has requested changes by {}", r.getUuid(), approver);
    // GraphQL mutations *have* to return something
    return numRows;
  }

  private void sendReportRejectEmail(Report r, Person rejector, Comment rejectionComment) {
    ReportRejectionEmail action = new ReportRejectionEmail();
    action.setReport(r);
    action.setRejector(rejector);
    action.setComment(rejectionComment);
    ReportDao.sendEmailToReportAuthors(action, r);
  }

  @GraphQLMutation(name = "publishReport")
  public int publishReport(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "uuid") String uuid) {
    Person user = DaoUtils.getUserFromContext(context);
    final Report r = reportDao.getByUuid(uuid);
    if (r == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found");
    }
    logger.debug("Attempting to publish report {}, which has advisor org {} and primary advisor {}",
        r, r.getAdvisorOrg(), r.getPrimaryAdvisor());

    // Only admin may publish a report
    if (!AuthUtils.isAdmin(user)) {
      logger.info("User {} cannot publish report UUID {}", user, r.getUuid());
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot publish this report");
    }

    final int numRows = reportDao.publish(r, user);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Couldn't process report publication");
    }

    AnetAuditLogger.log("report {} published by admin {}", r.getUuid(), user);
    // GraphQL mutations *have* to return something
    return numRows;
  }

  @GraphQLMutation(name = "unpublishReport")
  public Integer unpublishReport(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "uuid") String uuid) {
    // TODO: Do we need a reason here (like with rejectReport)?
    final Person unpublisher = DaoUtils.getUserFromContext(context);
    AuthUtils.assertAdministrator(unpublisher);
    final Report r = reportDao.getByUuid(uuid);
    if (r == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found");
    }

    if (r.getState() != ReportState.PUBLISHED) {
      logger.info("Report UUID {} cannot be unpublished", r.getUuid());
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This report is not published");
    }

    // Write the unpublish action
    final ReportAction unpublish = new ReportAction();
    unpublish.setReportUuid(r.getUuid());
    unpublish.setPersonUuid(unpublisher.getUuid());
    unpublish.setType(ActionType.UNPUBLISH);
    unpublish.setPlanned(r.isFutureEngagement());
    reportActionDao.insert(unpublish);

    // Update the report
    final int numRows = reportDao.updateToDraftState(r);
    if (numRows == 0) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND,
          "Couldn't process report unpublication");
    }

    // TODO: Do we need to send email?
    AnetAuditLogger.log("report {} was unpublished by {}", r.getUuid(), unpublisher);
    // GraphQL mutations *have* to return something
    return numRows;
  }

  @GraphQLMutation(name = "addComment")
  public Comment addComment(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "uuid") String reportUuid,
      @GraphQLArgument(name = "comment") Comment comment) {
    Person author = DaoUtils.getUserFromContext(context);
    comment.setReportUuid(reportUuid);
    comment.setAuthorUuid(author.getUuid());
    comment = commentDao.insert(comment);
    if (comment == null) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
          "Couldn't process adding new comment");
    }
    final Report r = reportDao.getByUuid(reportUuid);
    if (r == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found");
    }
    sendNewCommentEmail(r, comment);
    // GraphQL mutations *have* to return something
    return comment;
  }

  private void sendNewCommentEmail(Report r, Comment comment) {
    NewReportCommentEmail action = new NewReportCommentEmail();
    action.setReport(r);
    action.setComment(comment);
    ReportDao.sendEmailToReportAuthors(action, r);
  }

  @GraphQLMutation(name = "emailReport")
  public Integer emailReport(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "uuid") String reportUuid,
      @GraphQLArgument(name = "email") AnetEmail email) {
    Person user = DaoUtils.getUserFromContext(context);
    final Report r = reportDao.getByUuid(reportUuid);
    if (r == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found");
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
  public Integer deleteReport(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "uuid") String reportUuid) {
    Person user = DaoUtils.getUserFromContext(context);
    final Report report = reportDao.getByUuid(reportUuid);
    if (report == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found");
    }

    assertCanDeleteReport(report, user);
    AnetAuditLogger.log("report {} deleted by {}", reportUuid, user);

    return reportDao.delete(reportUuid);
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
    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot delete this report");
  }

  @GraphQLQuery(name = "reportList")
  public CompletableFuture<AnetBeanList<Report>> search(@GraphQLRootContext GraphQLContext context,
      @GraphQLEnvironment ResolutionEnvironment env,
      @GraphQLArgument(name = "query") ReportSearchQuery query) {
    query.setUser(DaoUtils.getUserFromContext(context));
    return reportDao.search(context, Utils.getSubFields(env), query);
  }

  /**
   * Get the daily rollup graph.
   *
   * @param start Start timestamp for the rollup period
   * @param end end timestamp for the rollup period
   * @param orgType The type of organization (ADVISOR or INTERLOCUTOR) that the chart should filter
   *        on
   * @param orgUuid if set then the parent advisor org to create the graph off of. All reports will
   *        be by/about this org or a child org.
   */
  @GraphQLQuery(name = "rollupGraph")
  public List<RollupGraph> getDailyRollupGraph(@GraphQLArgument(name = "startDate") Instant start,
      @GraphQLArgument(name = "endDate") Instant end,
      @GraphQLArgument(name = "orgType") RollupGraphType orgType,
      @GraphQLArgument(name = "orgUuid") String orgUuid) {
    @SuppressWarnings("unchecked")
    final List<String> nonReportingOrgsShortNames =
        (List<String>) dict.getDictionaryEntry("non_reporting_ORGs");
    final Map<String, Organization> nonReportingOrgs =
        getOrgsByShortNames(nonReportingOrgsShortNames);

    final List<RollupGraph> dailyRollupGraph =
        (orgUuid == null) ? reportDao.getDailyRollupGraph(start, end, orgType, nonReportingOrgs)
            : reportDao.getDailyRollupGraph(start, end, orgUuid, orgType, nonReportingOrgs);

    dailyRollupGraph.sort(getRollupGraphComparator());

    return dailyRollupGraph;
  }

  @GraphQLMutation(name = "emailRollup")
  public Integer emailRollup(@GraphQLArgument(name = "startDate") Instant start,
      @GraphQLArgument(name = "endDate") Instant end,
      @GraphQLArgument(name = "orgType") RollupGraphType orgType,
      @GraphQLArgument(name = "orgUuid") String orgUuid,
      @GraphQLArgument(name = "email") AnetEmail email) {
    DailyRollupEmail action = new DailyRollupEmail();
    action.setStartDate(start);
    action.setEndDate(end);
    action.setComment(email.getComment());
    action.setOrgUuid(orgUuid);
    action.setChartOrgType(orgType);

    email.setAction(action);
    AnetEmailWorker.sendEmailAsync(email);
    // GraphQL mutations *have* to return something, we return an integer
    return 1;
  }

  @GraphQLQuery(name = "showRollupEmail")
  public String showRollupEmail(@GraphQLArgument(name = "startDate") Instant start,
      @GraphQLArgument(name = "endDate") Instant end,
      @GraphQLArgument(name = "orgType") RollupGraphType orgType,
      @GraphQLArgument(name = "orgUuid") String orgUuid,
      @GraphQLArgument(name = "showText", defaultValue = "false") Boolean showReportText) {
    DailyRollupEmail action = new DailyRollupEmail();
    action.setStartDate(start);
    action.setEndDate(end);
    action.setChartOrgType(orgType);
    action.setOrgUuid(orgUuid);

    final Map<String, Object> emailContext = new HashMap<>();
    emailContext.put("context", engine.getContext());
    emailContext.put("serverUrl", config.getServerUrl());
    final var siteClassification = ConfidentialityRecord.getConfidentialityLabelForChoice(dict,
        (String) dict.getDictionaryEntry("siteClassification"));
    emailContext.put("SECURITY_BANNER_CLASSIFICATION",
        ConfidentialityRecord.create(siteClassification).toString());
    emailContext.put("SECURITY_BANNER_COLOR", siteClassification.get("color"));
    emailContext.put(DailyRollupEmail.SHOW_REPORT_TEXT_FLAG, showReportText);
    addConfigToContext(emailContext);

    try {
      final Template temp =
          Utils.getFreemarkerConfig(this.getClass()).getTemplate(action.getTemplateName());
      final StringWriter writer = new StringWriter();
      // scan:ignore — false positive, we know which template we are processing
      temp.process(action.buildContext(emailContext), writer);
      return writer.toString();
    } catch (Exception e) {
      throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error composing email",
          e);
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
      @GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "weeksAgo", defaultValue = "3") int weeksAgo,
      @GraphQLArgument(name = "orgUuid",
          defaultValue = Organization.DUMMY_ORG_UUID) String orgUuid) {
    Instant now = Instant.now();
    Instant weekStart = now.atZone(DaoUtils.getServerNativeZoneId()).with(DayOfWeek.MONDAY)
        .withHour(0).withMinute(0).withSecond(0).withNano(0).plusWeeks(1).toInstant();
    Instant startDate =
        weekStart.atZone(DaoUtils.getServerNativeZoneId()).minusWeeks(weeksAgo).toInstant();
    final List<Map<String, Object>> list =
        reportDao.getAdvisorReportInsights(startDate, weekStart, orgUuid);

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
    final List<AdvisorReportsEntry> result = new LinkedList<>();
    for (final Map<String, Object> group : groupedResults) {
      final AdvisorReportsEntry entry = new AdvisorReportsEntry();
      entry.setUuid((String) group.get(groupCol));
      entry.setName((String) group.get(topLevelField));
      final List<AdvisorReportsStats> stats = new LinkedList<>();
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
    for (final Organization organization : organizationDao.getOrgsByShortNames(orgShortNames)) {
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

      final int result;

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
  public int updateReportAssessments(@GraphQLRootContext GraphQLContext context,
      @GraphQLArgument(name = "reportUuid") String reportUuid,
      @GraphQLArgument(name = "assessments") List<Assessment> assessments) {
    // Do some sanity checks
    final Report r = reportDao.getByUuid(reportUuid);
    if (r == null) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found");
    }
    for (final Assessment assessment : assessments) {
      final List<GenericRelatedObject> assessmentRelatedObjects =
          assessment.getAssessmentRelatedObjects();
      if (assessmentRelatedObjects == null || assessmentRelatedObjects.size() != 2) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
            "Assessment must have two related objects");
      }
      // Check that assessment refers to this report and an attendee or task
      final GenericRelatedObject groReport;
      final GenericRelatedObject groPersonOrTask;
      if (ReportDao.TABLE_NAME.equals(assessmentRelatedObjects.get(0).getRelatedObjectType())) {
        groReport = assessmentRelatedObjects.get(0);
        groPersonOrTask = assessmentRelatedObjects.get(1);
      } else {
        groReport = assessmentRelatedObjects.get(1);
        groPersonOrTask = assessmentRelatedObjects.get(0);
      }
      if (!checkReportPersonOrTask(r, groReport, groPersonOrTask)) {
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
            "Assessment must link to report and person or task");
      }
      ResourceUtils.checkAndFixAssessment(assessment);
    }

    // Load the existing assessments
    final List<Assessment> existingAssessments = r.loadAssessments(engine.getContext()).join();

    // Process the assessments
    final Person user = DaoUtils.getUserFromContext(context);
    final String authorUuid = DaoUtils.getUuid(user);
    final Set<String> authorizationGroupUuids = DaoUtils.getAuthorizationGroupUuids(user);
    Utils.updateElementsByUuid(existingAssessments, assessments,
        // Create new assessments:
        newAssessment -> {
          checkAssessmentPermission(assessmentDao, user, authorizationGroupUuids, newAssessment,
              UpdateType.CREATE);
          newAssessment.setAuthorUuid(authorUuid);
          assessmentDao.insert(newAssessment);
        },
        // Delete old assessments:
        oldAssessment -> {
          final String oldAssessmentUuid = DaoUtils.getUuid(oldAssessment);
          final Assessment existingAssessment =
              Utils.getByUuid(existingAssessments, oldAssessmentUuid);
          checkAssessmentPermission(assessmentDao, user, authorizationGroupUuids,
              existingAssessment, UpdateType.DELETE);
          assessmentDao.delete(oldAssessmentUuid);
        },
        // Update existing assessments:
        updatedAssessment -> {
          final Assessment existingAssessment =
              Utils.getByUuid(existingAssessments, DaoUtils.getUuid(updatedAssessment));
          checkAssessmentPermission(assessmentDao, user, authorizationGroupUuids, updatedAssessment,
              UpdateType.UPDATE);
          if (!updatedAssessment.getAssessmentValues()
              .equals(existingAssessment.getAssessmentValues())) {
            updatedAssessment.setAuthorUuid(authorUuid);
            assessmentDao.update(updatedAssessment);
          }
        });

    return assessments.size();
  }

  private boolean checkReportPersonOrTask(Report r, GenericRelatedObject groReport,
      GenericRelatedObject groPersonOrTask) {
    // Check report
    if (!ReportDao.TABLE_NAME.equals(groReport.getRelatedObjectType())) {
      return false;
    }
    // Check report uuid
    if (!Objects.equals(DaoUtils.getUuid(r), groReport.getRelatedObjectUuid())) {
      return false;
    }
    // TODO: What about e.g. CANCELLED or PUBLISHED reports?
    // Check task uuid
    if (TaskDao.TABLE_NAME.equals(groPersonOrTask.getRelatedObjectType())) {
      return checkRelatedObject(
          r.loadTasks(ApplicationContextProvider.getEngine().getContext()).join(), groPersonOrTask);
    }
    // Check person uuid
    if (PersonDao.TABLE_NAME.equals(groPersonOrTask.getRelatedObjectType())) {
      return checkRelatedObject(
          r.loadReportPeople(ApplicationContextProvider.getEngine().getContext()).join(),
          groPersonOrTask);
    }
    return false;
  }

  private boolean checkRelatedObject(final List<? extends AbstractCustomizableAnetBean> beans,
      GenericRelatedObject gro) {
    if (beans == null) {
      return false;
    }
    return beans.stream().anyMatch(b -> Objects.equals(b.getUuid(), gro.getRelatedObjectUuid()));
  }

  private void checkAssessmentPermission(final AssessmentDao assessmentDao, final Person user,
      final Set<String> authorizationGroupUuids, final Assessment assessment,
      final UpdateType updateType) {
    if (!assessmentDao.hasAssessmentPermission(user, authorizationGroupUuids, assessment,
        updateType)) {
      // Don't provide too much information, just say it is "denied"
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Permission denied");
    }
  }

  private void addConfigToContext(Map<String, Object> context) {
    context.put("dateFormatter", Utils.getDateFormatter(dict, "dateFormats.email.date"));
    context.put("dateTimeFormatter",
        Utils.getDateTimeFormatter(dict, "dateFormats.email.withTime"));
    final boolean engagementsIncludeTimeAndDuration =
        Boolean.TRUE.equals(dict.getDictionaryEntry("engagementsIncludeTimeAndDuration"));
    context.put("engagementsIncludeTimeAndDuration", engagementsIncludeTimeAndDuration);
    context.put("engagementDateFormatter", Utils.getEngagementDateFormatter(dict,
        engagementsIncludeTimeAndDuration, "dateFormats.email.withTime", "dateFormats.email.date"));
    @SuppressWarnings("unchecked")
    final Map<String, Object> fields = (Map<String, Object>) dict.getDictionaryEntry("fields");
    context.put("fields", fields);
  }

  private RollupGraphComparator getRollupGraphComparator() {
    @SuppressWarnings("unchecked")
    final List<String> pinnedOrgNames = (List<String>) dict.getDictionaryEntry("pinned_ORGs");
    return new RollupGraphComparator(pinnedOrgNames);
  }
}

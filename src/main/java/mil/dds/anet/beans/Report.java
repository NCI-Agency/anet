package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import javax.ws.rs.WebApplicationException;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.Person.Role;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractCustomizableAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Report extends AbstractCustomizableAnetBean implements SubscribableObject {

  public enum ReportState {
    DRAFT, PENDING_APPROVAL, PUBLISHED, REJECTED, CANCELLED, // -
    @Deprecated
    FUTURE, // Should no longer be used but remain in place to keep the correct values
    APPROVED
  }

  public enum Atmosphere {
    POSITIVE, NEUTRAL, NEGATIVE
  }

  public enum ReportCancelledReason {
    CANCELLED_BY_ADVISOR, CANCELLED_BY_PRINCIPAL, CANCELLED_DUE_TO_TRANSPORTATION,
    CANCELLED_DUE_TO_FORCE_PROTECTION, CANCELLED_DUE_TO_ROUTES, CANCELLED_DUE_TO_THREAT,
    NO_REASON_GIVEN, CANCELLED_DUE_TO_AVAILABILITY_OF_INTERPRETERS
  }

  // annotated below
  private ForeignObjectHolder<ApprovalStep> approvalStep = new ForeignObjectHolder<>();
  @GraphQLQuery
  @GraphQLInputField
  ReportState state;
  @GraphQLQuery
  @GraphQLInputField
  Instant releasedAt;
  @GraphQLQuery
  @GraphQLInputField
  Instant engagementDate;
  @GraphQLQuery
  @GraphQLInputField
  private Integer engagementDayOfWeek;
  @GraphQLQuery
  @GraphQLInputField
  private Integer duration;
  // annotated below
  private ForeignObjectHolder<Location> location = new ForeignObjectHolder<>();
  @GraphQLQuery
  @GraphQLInputField
  String intent;
  @GraphQLQuery
  @GraphQLInputField
  String exsum; // can be null to autogenerate
  @GraphQLQuery
  @GraphQLInputField
  Atmosphere atmosphere;
  @GraphQLQuery
  @GraphQLInputField
  String atmosphereDetails;
  @GraphQLQuery
  @GraphQLInputField
  ReportCancelledReason cancelledReason;
  // annotated below
  List<ReportPerson> attendees;
  // annotated below
  List<Task> tasks;
  @GraphQLQuery
  @GraphQLInputField
  String keyOutcomes;
  @GraphQLQuery
  @GraphQLInputField
  String nextSteps;
  @GraphQLQuery
  @GraphQLInputField
  String reportText;
  // annotated below
  private ForeignObjectHolder<Person> author = new ForeignObjectHolder<>();
  // annotated below
  private ForeignObjectHolder<Organization> advisorOrg = new ForeignObjectHolder<>();
  // annotated below
  private ForeignObjectHolder<Organization> principalOrg = new ForeignObjectHolder<>();
  // annotated below
  private ForeignObjectHolder<ReportPerson> primaryAdvisor = new ForeignObjectHolder<>();
  // annotated below
  private ForeignObjectHolder<ReportPerson> primaryPrincipal = new ForeignObjectHolder<>();
  // annotated below
  List<Comment> comments;
  // annotated below
  private List<Tag> tags;
  // annotated below
  private ReportSensitiveInformation reportSensitiveInformation;
  // annotated below
  private List<AuthorizationGroup> authorizationGroups;
  // annotated below
  private List<ReportAction> workflow;

  @GraphQLQuery(name = "approvalStep")
  public CompletableFuture<ApprovalStep> loadApprovalStep(
      @GraphQLRootContext Map<String, Object> context) {
    if (approvalStep.hasForeignObject()) {
      return CompletableFuture.completedFuture(approvalStep.getForeignObject());
    }
    return new UuidFetcher<ApprovalStep>()
        .load(context, IdDataLoaderKey.APPROVAL_STEPS, approvalStep.getForeignUuid())
        .thenApply(o -> {
          approvalStep.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setApprovalStepUuid(String approvalStepUuid) {
    this.approvalStep = new ForeignObjectHolder<>(approvalStepUuid);
  }

  @JsonIgnore
  public String getApprovalStepUuid() {
    return approvalStep.getForeignUuid();
  }

  @GraphQLInputField(name = "approvalStep")
  public void setApprovalStep(ApprovalStep approvalStep) {
    this.approvalStep = new ForeignObjectHolder<>(approvalStep);
  }

  public ApprovalStep getApprovalStep() {
    return approvalStep.getForeignObject();
  }

  public ReportState getState() {
    return state;
  }

  public void setState(ReportState state) {
    this.state = state;
  }

  public Instant getReleasedAt() {
    return releasedAt;
  }

  public void setReleasedAt(Instant releasedAt) {
    this.releasedAt = releasedAt;
  }

  public Instant getEngagementDate() {
    return engagementDate;
  }

  public void setEngagementDate(Instant engagementDate) {
    this.engagementDate = engagementDate;
  }

  /**
   * Returns an Integer value from the set (1,2,3,4,5,6,7) in accordance with week days [Sunday,
   * Monday, Tuesday, Wednesday, Thursday, Friday, Saturday].
   *
   * @return Integer engagement day of week
   */
  public Integer getEngagementDayOfWeek() {
    return engagementDayOfWeek;
  }

  public void setEngagementDayOfWeek(Integer engagementDayOfWeek) {
    this.engagementDayOfWeek = engagementDayOfWeek;
  }

  public Integer getDuration() {
    return duration;
  }

  public void setDuration(Integer duration) {
    this.duration = duration;
  }

  @GraphQLQuery(name = "location")
  public CompletableFuture<Location> loadLocation(@GraphQLRootContext Map<String, Object> context) {
    if (location.hasForeignObject()) {
      return CompletableFuture.completedFuture(location.getForeignObject());
    }
    return new UuidFetcher<Location>()
        .load(context, IdDataLoaderKey.LOCATIONS, location.getForeignUuid()).thenApply(o -> {
          location.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setLocationUuid(String locationUuid) {
    this.location = new ForeignObjectHolder<>(locationUuid);
  }

  @JsonIgnore
  public String getLocationUuid() {
    return location.getForeignUuid();
  }

  @GraphQLInputField(name = "location")
  public void setLocation(Location location) {
    this.location = new ForeignObjectHolder<>(location);
  }

  public Location getLocation() {
    return location.getForeignObject();
  }

  public String getIntent() {
    return intent;
  }

  public void setIntent(String intent) {
    this.intent = Utils.trimStringReturnNull(intent);
  }

  public String getExsum() {
    return exsum;
  }

  public void setExsum(String exsum) {
    this.exsum = Utils.trimStringReturnNull(exsum);
  }

  public Atmosphere getAtmosphere() {
    return atmosphere;
  }

  public void setAtmosphere(Atmosphere atmosphere) {
    this.atmosphere = atmosphere;
  }

  public String getAtmosphereDetails() {
    return atmosphereDetails;
  }

  public void setAtmosphereDetails(String atmosphereDetails) {
    this.atmosphereDetails = Utils.trimStringReturnNull(atmosphereDetails);
  }

  public ReportCancelledReason getCancelledReason() {
    return cancelledReason;
  }

  public void setCancelledReason(ReportCancelledReason cancelledReason) {
    this.cancelledReason = cancelledReason;
  }

  @GraphQLQuery(name = "attendees")
  public CompletableFuture<List<ReportPerson>> loadAttendees(
      @GraphQLRootContext Map<String, Object> context) {
    if (attendees != null) {
      return CompletableFuture.completedFuture(attendees);
    }
    return AnetObjectEngine.getInstance().getReportDao().getAttendeesForReport(context, uuid)
        .thenApply(o -> {
          attendees = o;
          return o;
        });
  }

  public List<ReportPerson> getAttendees() {
    return attendees;
  }

  @GraphQLInputField(name = "attendees")
  public void setAttendees(List<ReportPerson> attendees) {
    this.attendees = attendees;
  }

  @GraphQLQuery(name = "primaryAdvisor")
  public CompletableFuture<ReportPerson> loadPrimaryAdvisor(
      @GraphQLRootContext Map<String, Object> context) {
    if (primaryAdvisor.hasForeignObject()) {
      return CompletableFuture.completedFuture(primaryAdvisor.getForeignObject());
    }
    return loadAttendees(context) // Force the load of attendees
        .thenApply(l -> {
          final ReportPerson o =
              l.stream().filter(p -> p.isPrimary() && p.getRole().equals(Role.ADVISOR)).findFirst()
                  .orElse(null);
          primaryAdvisor.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public ReportPerson getPrimaryAdvisor() {
    return primaryAdvisor.getForeignObject();
  }

  @GraphQLQuery(name = "primaryPrincipal")
  public CompletableFuture<ReportPerson> loadPrimaryPrincipal(
      @GraphQLRootContext Map<String, Object> context) {
    if (primaryPrincipal.hasForeignObject()) {
      return CompletableFuture.completedFuture(primaryPrincipal.getForeignObject());
    }
    return loadAttendees(context) // Force the load of attendees
        .thenApply(l -> {
          final ReportPerson o =
              l.stream().filter(p -> p.isPrimary() && p.getRole().equals(Role.PRINCIPAL))
                  .findFirst().orElse(null);
          primaryPrincipal.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public ReportPerson getPrimaryPrincipal() {
    return primaryPrincipal.getForeignObject();
  }

  @GraphQLQuery(name = "tasks")
  public CompletableFuture<List<Task>> loadTasks(@GraphQLRootContext Map<String, Object> context) {
    if (tasks != null) {
      return CompletableFuture.completedFuture(tasks);
    }
    return AnetObjectEngine.getInstance().getReportDao().getTasksForReport(context, uuid)
        .thenApply(o -> {
          tasks = o;
          return o;
        });
  }

  @GraphQLInputField(name = "tasks")
  public void setTasks(List<Task> tasks) {
    this.tasks = tasks;
  }

  public List<Task> getTasks() {
    return tasks;
  }

  public String getKeyOutcomes() {
    return keyOutcomes;
  }

  public void setKeyOutcomes(String keyOutcomes) {
    this.keyOutcomes = Utils.trimStringReturnNull(keyOutcomes);
  }

  public String getReportText() {
    return reportText;
  }

  public void setReportText(String reportText) {
    this.reportText = Utils.trimStringReturnNull(reportText);
  }

  public String getNextSteps() {
    return nextSteps;
  }

  public void setNextSteps(String nextSteps) {
    this.nextSteps = Utils.trimStringReturnNull(nextSteps);
  }

  @GraphQLQuery(name = "author")
  public CompletableFuture<Person> loadAuthor(@GraphQLRootContext Map<String, Object> context) {
    if (author.hasForeignObject()) {
      return CompletableFuture.completedFuture(author.getForeignObject());
    }
    return new UuidFetcher<Person>().load(context, IdDataLoaderKey.PEOPLE, author.getForeignUuid())
        .thenApply(o -> {
          author.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setAuthorUuid(String authorUuid) {
    this.author = new ForeignObjectHolder<>(authorUuid);
  }

  @JsonIgnore
  public String getAuthorUuid() {
    return author.getForeignUuid();
  }

  @GraphQLInputField(name = "author")
  public void setAuthor(Person author) {
    this.author = new ForeignObjectHolder<>(author);
  }

  public Person getAuthor() {
    return author.getForeignObject();
  }

  @GraphQLQuery(name = "advisorOrg")
  public CompletableFuture<Organization> loadAdvisorOrg(
      @GraphQLRootContext Map<String, Object> context) {
    if (advisorOrg.hasForeignObject()) {
      return CompletableFuture.completedFuture(advisorOrg.getForeignObject());
    }
    return new UuidFetcher<Organization>()
        .load(context, IdDataLoaderKey.ORGANIZATIONS, advisorOrg.getForeignUuid()).thenApply(o -> {
          advisorOrg.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setAdvisorOrgUuid(String advisorOrgUuid) {
    this.advisorOrg = new ForeignObjectHolder<>(advisorOrgUuid);
  }

  @JsonIgnore
  public String getAdvisorOrgUuid() {
    return advisorOrg.getForeignUuid();
  }

  @GraphQLInputField(name = "advisorOrg")
  public void setAdvisorOrg(Organization advisorOrg) {
    this.advisorOrg = new ForeignObjectHolder<>(advisorOrg);
  }

  public Organization getAdvisorOrg() {
    return advisorOrg.getForeignObject();
  }

  @GraphQLQuery(name = "principalOrg")
  public CompletableFuture<Organization> loadPrincipalOrg(
      @GraphQLRootContext Map<String, Object> context) {
    if (principalOrg.hasForeignObject()) {
      return CompletableFuture.completedFuture(principalOrg.getForeignObject());
    }
    return new UuidFetcher<Organization>()
        .load(context, IdDataLoaderKey.ORGANIZATIONS, principalOrg.getForeignUuid())
        .thenApply(o -> {
          principalOrg.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setPrincipalOrgUuid(String principalOrgUuid) {
    this.principalOrg = new ForeignObjectHolder<>(principalOrgUuid);
  }

  @JsonIgnore
  public String getPrincipalOrgUuid() {
    return principalOrg.getForeignUuid();
  }

  public Organization getPrincipalOrg() {
    return principalOrg.getForeignObject();
  }

  @GraphQLInputField(name = "principalOrg")
  public void setPrincipalOrg(Organization principalOrg) {
    this.principalOrg = new ForeignObjectHolder<>(principalOrg);
  }

  // TODO: batch load? (used in reports/{Minimal,Show}.js
  @GraphQLQuery(name = "comments")
  public synchronized List<Comment> loadComments() {
    if (comments == null) {
      comments = AnetObjectEngine.getInstance().getCommentDao().getCommentsForReport(uuid);
    }
    return comments;
  }

  @GraphQLInputField(name = "comments")
  public void setComments(List<Comment> comments) {
    this.comments = comments;
  }

  public List<Comment> getComments() {
    return comments;
  }

  public CompletableFuture<List<ApprovalStep>> computeApprovalSteps(Map<String, Object> context,
      AnetObjectEngine engine) {
    final String advisorOrgUuid = getAdvisorOrgUuid();
    return getOrganizationWorkflow(context, engine, advisorOrgUuid).thenCompose(steps -> {
      if (Utils.isEmptyOrNull(steps)) {
        final String defaultOrgUuid = engine.getDefaultOrgUuid();
        if (advisorOrgUuid == null || !Objects.equals(advisorOrgUuid, defaultOrgUuid)) {
          return getDefaultOrganizationWorkflow(context, engine, defaultOrgUuid);
        }
      }
      return CompletableFuture.completedFuture(steps);
    }).thenCompose(steps -> {
      return loadTasks(context).thenCompose(tasks -> {
        if (Utils.isEmptyOrNull(tasks)) {
          return CompletableFuture.completedFuture(steps);
        } else {
          return getTaskWorkflow(context, engine, tasks.iterator())
              .thenCompose(taskApprovalSteps -> {
                steps.addAll(taskApprovalSteps);
                return CompletableFuture.completedFuture(steps);
              });
        }
      });
    });
  }

  /*
   * Returns a list of report actions. It depends on the report status: - for APPROVED or PUBLISHED
   * reports, it returns all existing report actions - for reports in other steps it also creates
   * report actions for all the approval steps for which it does not have related report actions
   * yet.
   */
  @GraphQLQuery(name = "workflow")
  public CompletableFuture<List<ReportAction>> loadWorkflow(
      @GraphQLRootContext Map<String, Object> context) {
    if (workflow != null) {
      return CompletableFuture.completedFuture(workflow);
    }
    AnetObjectEngine engine = AnetObjectEngine.getInstance();
    return engine.getReportActionDao().getActionsForReport(context, uuid).thenCompose(actions -> {
      // For reports which are not approved or published, make sure there
      // is a report action for each approval step.
      if (state == ReportState.APPROVED || state == ReportState.PUBLISHED) {
        workflow = actions;
        return CompletableFuture.completedFuture(workflow);
      } else {
        return computeApprovalSteps(context, engine).thenCompose(steps -> {
          final List<ReportAction> actionTail = getActionTail(actions);
          actionTail.addAll(createApprovalStepsActions(actionTail, steps));
          workflow = actionTail;
          return CompletableFuture.completedFuture(workflow);
        });
      }
    });
  }

  private List<ReportAction> getActionTail(List<ReportAction> actions) {
    final List<ReportAction> actionTail = new ArrayList<>();
    for (int i = actions.size() - 1; i >= 0; i--) {
      final ReportAction action = actions.get(i);
      actionTail.add(0, action);
      if (ReportAction.ActionType.SUBMIT.equals(action.getType())) {
        break;
      }
    }
    return actionTail;
  }

  public List<ReportAction> getWorkflow() {
    return workflow;
  }

  @GraphQLInputField(name = "workflow")
  public void setWorkflow(List<ReportAction> workflow) {
    this.workflow = workflow;
  }

  private List<ReportAction> createApprovalStepsActions(List<ReportAction> actions,
      List<ApprovalStep> steps) {
    final List<ReportAction> newActions = new LinkedList<ReportAction>();
    for (final ApprovalStep step : steps) {
      // Check if there are report actions for this step
      final Optional<ReportAction> existing =
          actions.stream().filter(a -> Objects.equals(DaoUtils.getUuid(step), a.getStepUuid()))
              .max(new Comparator<ReportAction>() {
                public int compare(ReportAction a, ReportAction b) {
                  return a.getCreatedAt().compareTo(b.getCreatedAt());
                }
              });
      if (!existing.isPresent()) {
        // If there is no action for this step, create a new one and attach this step
        final ReportAction action;
        action = new ReportAction();
        action.setStep(step);
        newActions.add(action);
      }
    }
    return newActions;
  }

  private CompletableFuture<List<ApprovalStep>> getOrganizationWorkflow(Map<String, Object> context,
      AnetObjectEngine engine, String advisorOrgUuid) {
    return isFutureEngagement()
        ? getPlanningWorkflowForRelatedObject(context, engine, advisorOrgUuid)
        : getWorkflowForRelatedObject(context, engine, advisorOrgUuid);
  }

  private CompletableFuture<List<ApprovalStep>> getPlanningWorkflowForRelatedObject(
      Map<String, Object> context, AnetObjectEngine engine, String relatedObjectUuid) {
    if (relatedObjectUuid == null) {
      return CompletableFuture.completedFuture(new ArrayList<ApprovalStep>());
    }

    return engine.getPlanningApprovalStepsForRelatedObject(context, relatedObjectUuid);
  }

  private CompletableFuture<List<ApprovalStep>> getWorkflowForRelatedObject(
      Map<String, Object> context, AnetObjectEngine engine, String relatedObjectUuid) {
    if (relatedObjectUuid == null) {
      return CompletableFuture.completedFuture(new ArrayList<ApprovalStep>());
    }

    return engine.getApprovalStepsForRelatedObject(context, relatedObjectUuid);
  }

  private CompletableFuture<List<ApprovalStep>> getDefaultOrganizationWorkflow(
      Map<String, Object> context, AnetObjectEngine engine, String defaultOrgUuid) {
    return isFutureEngagement() ? getDefaultPlanningWorkflow(context, engine, defaultOrgUuid)
        : getDefaultWorkflow(context, engine, defaultOrgUuid);
  }

  private CompletableFuture<List<ApprovalStep>> getDefaultPlanningWorkflow(
      Map<String, Object> context, AnetObjectEngine engine, String defaultOrgUuid) {
    if (defaultOrgUuid == null) {
      throw new WebApplicationException("Missing the DEFAULT_APPROVAL_ORGANIZATION admin setting");
    }
    return getPlanningWorkflowForRelatedObject(context, engine, defaultOrgUuid);
  }

  private CompletableFuture<List<ApprovalStep>> getDefaultWorkflow(Map<String, Object> context,
      AnetObjectEngine engine, String defaultOrgUuid) {
    if (defaultOrgUuid == null) {
      throw new WebApplicationException("Missing the DEFAULT_APPROVAL_ORGANIZATION admin setting");
    }
    return getWorkflowForRelatedObject(context, engine, defaultOrgUuid);
  }

  private CompletableFuture<List<ApprovalStep>> getTaskWorkflow(Map<String, Object> context,
      AnetObjectEngine engine, Iterator<Task> taskIterator) {
    if (!taskIterator.hasNext()) {
      return CompletableFuture.completedFuture(new ArrayList<>());
    } else {
      final Task task = taskIterator.next();
      return getWorkflowForRelatedObject(context, engine, DaoUtils.getUuid(task))
          .thenCompose(taskSteps -> {
            return getTaskWorkflow(context, engine, taskIterator).thenCompose(nextTaskSteps -> {
              taskSteps.addAll(nextTaskSteps);
              return CompletableFuture.completedFuture(taskSteps);
            });
          });
    }
  }

  @GraphQLQuery(name = "tags")
  public CompletableFuture<List<Tag>> loadTags(@GraphQLRootContext Map<String, Object> context) {
    if (tags != null) {
      return CompletableFuture.completedFuture(tags);
    }
    return AnetObjectEngine.getInstance().getReportDao().getTagsForReport(context, uuid)
        .thenApply(o -> {
          tags = o;
          return o;
        });
  }

  public List<Tag> getTags() {
    return tags;
  }

  @GraphQLInputField(name = "tags")
  public void setTags(List<Tag> tags) {
    this.tags = tags;
  }

  @GraphQLQuery(name = "reportSensitiveInformation")
  public CompletableFuture<ReportSensitiveInformation> loadReportSensitiveInformation(
      @GraphQLRootContext Map<String, Object> context) {
    if (reportSensitiveInformation != null) {
      return CompletableFuture.completedFuture(reportSensitiveInformation);
    }
    return AnetObjectEngine.getInstance().getReportSensitiveInformationDao()
        .getForReport(context, this, DaoUtils.getUserFromContext(context)).thenApply(o -> {
          reportSensitiveInformation = o;
          return o;
        });
  }

  public ReportSensitiveInformation getReportSensitiveInformation() {
    return reportSensitiveInformation;
  }

  @GraphQLInputField(name = "reportSensitiveInformation")
  public void setReportSensitiveInformation(ReportSensitiveInformation reportSensitiveInformation) {
    this.reportSensitiveInformation = reportSensitiveInformation;
  }

  // TODO: batch load? (used in reports/{Edit,Show}.js)
  @GraphQLQuery(name = "authorizationGroups")
  public synchronized List<AuthorizationGroup> loadAuthorizationGroups() {
    if (authorizationGroups == null && uuid != null) {
      authorizationGroups =
          AnetObjectEngine.getInstance().getReportDao().getAuthorizationGroupsForReport(uuid);
    }
    return authorizationGroups;
  }

  @GraphQLInputField(name = "authorizationGroups")
  public void setAuthorizationGroups(List<AuthorizationGroup> authorizationGroups) {
    this.authorizationGroups = authorizationGroups;
  }

  public List<AuthorizationGroup> getAuthorizationGroups() {
    return authorizationGroups;
  }

  @JsonIgnore
  public boolean isFutureEngagement() {
    return engagementDate != null && engagementDate.isAfter(Utils.endOfToday());
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof Report)) {
      return false;
    }
    Report r = (Report) o;
    return Objects.equals(r.getUuid(), uuid) && Objects.equals(r.getState(), state)
        && Objects.equals(r.getApprovalStepUuid(), getApprovalStepUuid())
        && Objects.equals(r.getCreatedAt(), createdAt)
        && Objects.equals(r.getUpdatedAt(), updatedAt)
        && Objects.equals(r.getEngagementDate(), engagementDate)
        && Objects.equals(r.getDuration(), duration)
        && Objects.equals(r.getLocationUuid(), getLocationUuid())
        && Objects.equals(r.getIntent(), intent) && Objects.equals(r.getExsum(), exsum)
        && Objects.equals(r.getAtmosphere(), atmosphere)
        && Objects.equals(r.getAtmosphereDetails(), atmosphereDetails)
        && Objects.equals(r.getAttendees(), attendees) && Objects.equals(r.getTasks(), tasks)
        && Objects.equals(r.getReportText(), reportText)
        && Objects.equals(r.getNextSteps(), nextSteps)
        && Objects.equals(r.getAuthorUuid(), getAuthorUuid())
        && Objects.equals(r.getComments(), comments) && Objects.equals(r.getTags(), tags)
        && Objects.equals(r.getReportSensitiveInformation(), reportSensitiveInformation)
        && Objects.equals(r.getAuthorizationGroups(), authorizationGroups)
        && Objects.equals(r.getCustomFields(), customFields);
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, state, approvalStep, createdAt, updatedAt, location, intent, exsum,
        attendees, tasks, reportText, nextSteps, author, comments, atmosphere, atmosphereDetails,
        engagementDate, duration, tags, reportSensitiveInformation, authorizationGroups);
  }

  public static Report createWithUuid(String uuid) {
    final Report r = new Report();
    r.setUuid(uuid);
    return r;
  }

  @Override
  public String toString() {
    return String.format("[uuid:%s, intent:%s]", uuid, intent);
  }
}

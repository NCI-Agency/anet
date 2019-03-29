package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
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
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Report extends AbstractAnetBean {

  public enum ReportState {
    DRAFT, PENDING_APPROVAL, PUBLISHED, REJECTED, CANCELLED, FUTURE, APPROVED
  }
  public enum Atmosphere {
    POSITIVE, NEUTRAL, NEGATIVE
  }
  public enum ReportCancelledReason {
    CANCELLED_BY_ADVISOR, CANCELLED_BY_PRINCIPAL, CANCELLED_DUE_TO_TRANSPORTATION, CANCELLED_DUE_TO_FORCE_PROTECTION, CANCELLED_DUE_TO_ROUTES, CANCELLED_DUE_TO_THREAT, NO_REASON_GIVEN, CANCELLED_DUE_TO_AVAILABILITY_OF_INTERPRETERS
  }

  private ForeignObjectHolder<ApprovalStep> approvalStep = new ForeignObjectHolder<>();
  ReportState state;
  Instant releasedAt;

  Instant engagementDate;
  private Integer engagementDayOfWeek;
  private ForeignObjectHolder<Location> location = new ForeignObjectHolder<>();
  String intent;
  String exsum; // can be null to autogenerate
  Atmosphere atmosphere;
  String atmosphereDetails;
  ReportCancelledReason cancelledReason;

  List<ReportPerson> attendees;
  List<Task> tasks;

  String keyOutcomes;
  String nextSteps;
  String reportText;

  private ForeignObjectHolder<Person> author = new ForeignObjectHolder<>();
  private ForeignObjectHolder<Organization> advisorOrg = new ForeignObjectHolder<>();
  private ForeignObjectHolder<Organization> principalOrg = new ForeignObjectHolder<>();
  private ForeignObjectHolder<ReportPerson> primaryAdvisor = new ForeignObjectHolder<>();
  private ForeignObjectHolder<ReportPerson> primaryPrincipal = new ForeignObjectHolder<>();

  List<Comment> comments;
  private List<Tag> tags;
  private ReportSensitiveInformation reportSensitiveInformation;
  // The user who instantiated this; needed to determine access to sensitive information
  private Person user;
  private List<AuthorizationGroup> authorizationGroups;
  private List<ReportAction> workflow;

  @GraphQLQuery(name = "approvalStep")
  public CompletableFuture<ApprovalStep> loadApprovalStep(
      @GraphQLRootContext Map<String, Object> context) {
    if (approvalStep.hasForeignObject()) {
      return CompletableFuture.completedFuture(approvalStep.getForeignObject());
    }
    return new UuidFetcher<ApprovalStep>()
        .load(context, "approvalSteps", approvalStep.getForeignUuid()).thenApply(o -> {
          approvalStep.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  @GraphQLIgnore
  public void setApprovalStepUuid(String approvalStepUuid) {
    this.approvalStep = new ForeignObjectHolder<>(approvalStepUuid);
  }

  @JsonIgnore
  @GraphQLIgnore
  public String getApprovalStepUuid() {
    return approvalStep.getForeignUuid();
  }

  public void setApprovalStep(ApprovalStep approvalStep) {
    this.approvalStep = new ForeignObjectHolder<>(approvalStep);
  }

  @GraphQLIgnore
  public ApprovalStep getApprovalStep() {
    return approvalStep.getForeignObject();
  }

  @GraphQLQuery(name = "state")
  public ReportState getState() {
    return state;
  }

  public void setState(ReportState state) {
    this.state = state;
  }

  @GraphQLQuery(name = "releasedAt")
  public Instant getReleasedAt() {
    return releasedAt;
  }

  public void setReleasedAt(Instant releasedAt) {
    this.releasedAt = releasedAt;
  }

  @GraphQLQuery(name = "engagementDate")
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
  @GraphQLQuery(name = "engagementDayOfWeek")
  public Integer getEngagementDayOfWeek() {
    return engagementDayOfWeek;
  }

  public void setEngagementDayOfWeek(Integer engagementDayOfWeek) {
    this.engagementDayOfWeek = engagementDayOfWeek;
  }

  @GraphQLQuery(name = "location")
  public CompletableFuture<Location> loadLocation(@GraphQLRootContext Map<String, Object> context) {
    if (location.hasForeignObject()) {
      return CompletableFuture.completedFuture(location.getForeignObject());
    }
    return new UuidFetcher<Location>().load(context, "locations", location.getForeignUuid())
        .thenApply(o -> {
          location.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  @GraphQLIgnore
  public void setLocationUuid(String locationUuid) {
    this.location = new ForeignObjectHolder<>(locationUuid);
  }

  @JsonIgnore
  @GraphQLIgnore
  public String getLocationUuid() {
    return location.getForeignUuid();
  }

  public void setLocation(Location location) {
    this.location = new ForeignObjectHolder<>(location);
  }

  @GraphQLIgnore
  public Location getLocation() {
    return location.getForeignObject();
  }

  @GraphQLQuery(name = "intent")
  public String getIntent() {
    return intent;
  }

  @GraphQLQuery(name = "exsum")
  public String getExsum() {
    return exsum;
  }

  public void setExsum(String exsum) {
    this.exsum = Utils.trimStringReturnNull(exsum);
  }

  @GraphQLQuery(name = "atmosphere")
  public Atmosphere getAtmosphere() {
    return atmosphere;
  }

  public void setAtmosphere(Atmosphere atmosphere) {
    this.atmosphere = atmosphere;
  }

  @GraphQLQuery(name = "atmosphereDetails")
  public String getAtmosphereDetails() {
    return atmosphereDetails;
  }

  public void setAtmosphereDetails(String atmosphereDetails) {
    this.atmosphereDetails = Utils.trimStringReturnNull(atmosphereDetails);
  }

  @GraphQLQuery(name = "cancelledReason")
  public ReportCancelledReason getCancelledReason() {
    return cancelledReason;
  }

  public void setCancelledReason(ReportCancelledReason cancelledReason) {
    this.cancelledReason = cancelledReason;
  }

  public void setIntent(String intent) {
    this.intent = Utils.trimStringReturnNull(intent);
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

  @GraphQLIgnore
  public List<ReportPerson> getAttendees() {
    return attendees;
  }

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
  @GraphQLIgnore
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
  @GraphQLIgnore
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

  public void setTasks(List<Task> tasks) {
    this.tasks = tasks;
  }

  @GraphQLIgnore
  public List<Task> getTasks() {
    return tasks;
  }

  @GraphQLQuery(name = "keyOutcomes")
  public String getKeyOutcomes() {
    return keyOutcomes;
  }

  public void setKeyOutcomes(String keyOutcomes) {
    this.keyOutcomes = Utils.trimStringReturnNull(keyOutcomes);
  }

  @GraphQLQuery(name = "reportText")
  public String getReportText() {
    return reportText;
  }

  public void setReportText(String reportText) {
    this.reportText = Utils.trimStringReturnNull(reportText);
  }

  @GraphQLQuery(name = "nextSteps")
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
    return new UuidFetcher<Person>().load(context, "people", author.getForeignUuid())
        .thenApply(o -> {
          author.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  @GraphQLIgnore
  public void setAuthorUuid(String authorUuid) {
    this.author = new ForeignObjectHolder<>(authorUuid);
  }

  @JsonIgnore
  @GraphQLIgnore
  public String getAuthorUuid() {
    return author.getForeignUuid();
  }

  public void setAuthor(Person author) {
    this.author = new ForeignObjectHolder<>(author);
  }

  @GraphQLIgnore
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
        .load(context, "organizations", advisorOrg.getForeignUuid()).thenApply(o -> {
          advisorOrg.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  @GraphQLIgnore
  public void setAdvisorOrgUuid(String advisorOrgUuid) {
    this.advisorOrg = new ForeignObjectHolder<>(advisorOrgUuid);
  }

  @JsonIgnore
  @GraphQLIgnore
  public String getAdvisorOrgUuid() {
    return advisorOrg.getForeignUuid();
  }

  public void setAdvisorOrg(Organization advisorOrg) {
    this.advisorOrg = new ForeignObjectHolder<>(advisorOrg);
  }

  @GraphQLIgnore
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
        .load(context, "organizations", principalOrg.getForeignUuid()).thenApply(o -> {
          principalOrg.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  @GraphQLIgnore
  public void setPrincipalOrgUuid(String principalOrgUuid) {
    this.principalOrg = new ForeignObjectHolder<>(principalOrgUuid);
  }

  @JsonIgnore
  @GraphQLIgnore
  public String getPrincipalOrgUuid() {
    return principalOrg.getForeignUuid();
  }

  @GraphQLIgnore
  public Organization getPrincipalOrg() {
    return principalOrg.getForeignObject();
  }

  public void setPrincipalOrg(Organization principalOrg) {
    this.principalOrg = new ForeignObjectHolder<>(principalOrg);
  }

  @GraphQLQuery(name = "comments") // TODO: batch load? (used in reports/{Minimal,Show}.js
  public synchronized List<Comment> loadComments() {
    if (comments == null) {
      comments = AnetObjectEngine.getInstance().getCommentDao().getCommentsForReport(uuid);
    }
    return comments;
  }

  public void setComments(List<Comment> comments) {
    this.comments = comments;
  }

  @GraphQLIgnore
  public List<Comment> getComments() {
    return comments;
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
        return getWorkflowForOrg(context, engine, getAdvisorOrgUuid()).thenCompose(steps -> {
          if (Utils.isEmptyOrNull(steps)) {
            final String defaultOrgUuid = engine.getDefaultOrgUuid();
            if (getAdvisorOrgUuid() == null
                || !Objects.equals(getAdvisorOrgUuid(), defaultOrgUuid)) {
              return getDefaultWorkflow(context, engine, defaultOrgUuid);
            }
          }
          return CompletableFuture.completedFuture(steps);
        }).thenCompose(steps -> {
          final List<ReportAction> newApprovalStepsActions =
              createApprovalStepsActions(actions, steps);
          actions.addAll(newApprovalStepsActions);
          workflow = actions;
          return CompletableFuture.completedFuture(workflow);
        });
      }
    });
  }

  @GraphQLIgnore
  public List<ReportAction> getWorkflow() {
    return workflow;
  }

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

  private CompletableFuture<List<ApprovalStep>> getWorkflowForOrg(Map<String, Object> context,
      AnetObjectEngine engine, String aoUuid) {
    if (aoUuid == null) {
      return CompletableFuture.completedFuture(new ArrayList<ApprovalStep>());
    }

    return engine.getApprovalStepsForOrg(context, aoUuid);
  }

  private CompletableFuture<List<ApprovalStep>> getDefaultWorkflow(Map<String, Object> context,
      AnetObjectEngine engine, String defaultOrgUuid) {
    if (defaultOrgUuid == null) {
      throw new WebApplicationException("Missing the DEFAULT_APPROVAL_ORGANIZATION admin setting");
    }
    return getWorkflowForOrg(context, engine, defaultOrgUuid);
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

  @GraphQLIgnore
  public List<Tag> getTags() {
    return tags;
  }

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
        .getForReport(context, this, user).thenApply(o -> {
          reportSensitiveInformation = o;
          return o;
        });
  }

  @GraphQLIgnore
  public ReportSensitiveInformation getReportSensitiveInformation() {
    return reportSensitiveInformation;
  }

  public void setReportSensitiveInformation(ReportSensitiveInformation reportSensitiveInformation) {
    this.reportSensitiveInformation = reportSensitiveInformation;
  }

  @JsonIgnore
  @GraphQLIgnore
  public Person getUser() {
    return user;
  }

  @JsonIgnore
  @GraphQLIgnore
  public void setUser(Person user) {
    this.user = user;
  }

  @GraphQLQuery(name = "authorizationGroups") // TODO: batch load? (used in reports/{Edit,Show}.js)
  public synchronized List<AuthorizationGroup> loadAuthorizationGroups() {
    if (authorizationGroups == null && uuid != null) {
      authorizationGroups =
          AnetObjectEngine.getInstance().getReportDao().getAuthorizationGroupsForReport(uuid);
    }
    return authorizationGroups;
  }

  public void setAuthorizationGroups(List<AuthorizationGroup> authorizationGroups) {
    this.authorizationGroups = authorizationGroups;
  }

  @GraphQLIgnore
  public List<AuthorizationGroup> getAuthorizationGroups() {
    return authorizationGroups;
  }

  @Override
  public boolean equals(Object other) {
    if (other == null || other.getClass() != this.getClass()) {
      return false;
    }
    Report r = (Report) other;
    return Objects.equals(r.getUuid(), uuid) && Objects.equals(r.getState(), state)
        && Objects.equals(r.getApprovalStepUuid(), getApprovalStepUuid())
        && Objects.equals(r.getCreatedAt(), createdAt)
        && Objects.equals(r.getUpdatedAt(), updatedAt)
        && Objects.equals(r.getEngagementDate(), engagementDate)
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
        && Objects.equals(r.getAuthorizationGroups(), authorizationGroups);
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, state, approvalStep, createdAt, updatedAt, location, intent, exsum,
        attendees, tasks, reportText, nextSteps, author, comments, atmosphere, atmosphereDetails,
        engagementDate, tags, reportSensitiveInformation, authorizationGroups);
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

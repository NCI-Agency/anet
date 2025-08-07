package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Iterator;
import java.util.LinkedList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.AbstractCustomizableAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Report extends AbstractCustomizableAnetBean
    implements RelatableObject, SubscribableObject {

  public enum ReportState {
    DRAFT, PENDING_APPROVAL, PUBLISHED, REJECTED, CANCELLED, // -
    @Deprecated
    FUTURE, // Should no longer be used but remain in place to keep the correct values
    APPROVED
  }

  public enum EngagementStatus {
    HAPPENED, FUTURE, CANCELLED
  }

  public enum Atmosphere {
    POSITIVE, NEUTRAL, NEGATIVE
  }

  public enum ReportCancelledReason {
    CANCELLED_BY_ADVISOR, CANCELLED_BY_INTERLOCUTOR, CANCELLED_DUE_TO_TRANSPORTATION,
    CANCELLED_DUE_TO_FORCE_PROTECTION, CANCELLED_DUE_TO_ROUTES, CANCELLED_DUE_TO_THREAT,
    NO_REASON_GIVEN, CANCELLED_DUE_TO_AVAILABILITY_OF_INTERPRETERS, CANCELLED_DUE_TO_NETWORK_ISSUES
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
  @GraphQLQuery
  @GraphQLInputField
  private String classification;
  // annotated below
  private List<ReportPerson> reportPeople;
  // annotated below
  private List<ReportPerson> attendees;
  // annotated below
  private ForeignObjectHolder<Organization> advisorOrg = new ForeignObjectHolder<>();
  // annotated below
  private ForeignObjectHolder<Organization> interlocutorOrg = new ForeignObjectHolder<>();
  // annotated below
  private ForeignObjectHolder<ReportPerson> primaryAdvisor = new ForeignObjectHolder<>();
  // annotated below
  private ForeignObjectHolder<ReportPerson> primaryInterlocutor = new ForeignObjectHolder<>();
  // annotated below
  private List<ReportPerson> authors;
  // annotated below
  List<Comment> comments;
  // annotated below
  private ReportSensitiveInformation reportSensitiveInformation;
  // annotated below
  private List<GenericRelatedObject> authorizedMembers;
  // annotated below
  private List<ReportAction> workflow;
  // annotated below
  private ForeignObjectHolder<Event> event = new ForeignObjectHolder<>();

  @GraphQLQuery(name = "approvalStep")
  public CompletableFuture<ApprovalStep> loadApprovalStep(
      @GraphQLRootContext GraphQLContext context) {
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
   * Returns an Integer value from the set (0,1,2,3,4,5,6) in accordance with week days [Sunday,
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

  public String getClassification() {
    return classification;
  }

  public void setClassification(final String classification) {
    this.classification = classification;
  }

  @GraphQLQuery(name = "location")
  public CompletableFuture<Location> loadLocation(@GraphQLRootContext GraphQLContext context) {
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

  @GraphQLQuery(name = "reportPeople")
  public CompletableFuture<List<ReportPerson>> loadReportPeople(
      @GraphQLRootContext GraphQLContext context) {
    if (reportPeople != null) {
      return CompletableFuture.completedFuture(reportPeople);
    }
    return engine().getReportDao().getPeopleForReport(context, uuid).thenApply(o -> {
      reportPeople = o;
      return o;
    });
  }

  public List<ReportPerson> getReportPeople() {
    return reportPeople;
  }

  @GraphQLInputField(name = "reportPeople")
  public void setReportPeople(List<ReportPerson> reportPeople) {
    this.reportPeople = reportPeople;
  }

  @GraphQLQuery(name = "attendees")
  public CompletableFuture<List<ReportPerson>> loadAttendees(
      @GraphQLRootContext GraphQLContext context) {
    if (attendees != null) {
      return CompletableFuture.completedFuture(attendees);
    }
    return loadReportPeople(context) // Force the load of reportPeople
        .thenApply(l -> {
          final List<ReportPerson> o =
              l.stream().filter(ReportPerson::isAttendee).collect(Collectors.toList());
          attendees = o;
          return o;
        });
  }

  @JsonIgnore
  public List<ReportPerson> getAttendees() {
    return attendees;
  }

  @GraphQLQuery(name = "primaryAdvisor")
  public CompletableFuture<ReportPerson> loadPrimaryAdvisor(
      @GraphQLRootContext GraphQLContext context) {
    if (primaryAdvisor.hasForeignObject()) {
      return CompletableFuture.completedFuture(primaryAdvisor.getForeignObject());
    }
    return loadReportPeople(context) // Force the load of reportPeople
        .thenApply(l -> {
          final ReportPerson o =
              l.stream().filter(p -> p.isPrimary() && !p.isInterlocutor()).findFirst().orElse(null);
          primaryAdvisor.setForeignObject(o);
          return o;
        });
  }

  @GraphQLIgnore
  public void setPrimaryAdvisor(ReportPerson primaryAdvisor) {
    this.primaryAdvisor = new ForeignObjectHolder<>(primaryAdvisor);
  }

  @GraphQLIgnore
  public ReportPerson getPrimaryAdvisor() {
    return primaryAdvisor.getForeignObject();
  }

  @GraphQLQuery(name = "primaryInterlocutor")
  public CompletableFuture<ReportPerson> loadPrimaryInterlocutor(
      @GraphQLRootContext GraphQLContext context) {
    if (primaryInterlocutor.hasForeignObject()) {
      return CompletableFuture.completedFuture(primaryInterlocutor.getForeignObject());
    }
    return loadReportPeople(context) // Force the load of reportPeople
        .thenApply(l -> {
          final ReportPerson o =
              l.stream().filter(p -> p.isPrimary() && p.isInterlocutor()).findFirst().orElse(null);
          primaryInterlocutor.setForeignObject(o);
          return o;
        });
  }

  @GraphQLIgnore
  public void setPrimaryInterlocutor(ReportPerson primaryInterlocutor) {
    this.primaryInterlocutor = new ForeignObjectHolder<>(primaryInterlocutor);
  }

  @GraphQLIgnore
  public ReportPerson getPrimaryInterlocutor() {
    return primaryInterlocutor.getForeignObject();
  }

  @GraphQLQuery(name = "authors")
  public CompletableFuture<List<ReportPerson>> loadAuthors(
      @GraphQLRootContext GraphQLContext context) {
    if (authors != null) {
      return CompletableFuture.completedFuture(authors);
    }
    return loadReportPeople(context) // Force the load of reportPeople
        .thenApply(l -> {
          final List<ReportPerson> o =
              l.stream().filter(ReportPerson::isAuthor).collect(Collectors.toList());
          authors = o;
          return o;
        });
  }

  @JsonIgnore
  public List<ReportPerson> getAuthors() {
    return authors;
  }

  @GraphQLQuery(name = "tasks")
  public CompletableFuture<List<Task>> loadTasks(@GraphQLRootContext GraphQLContext context) {
    if (tasks != null) {
      return CompletableFuture.completedFuture(tasks);
    }
    return engine().getReportDao().getTasksForReport(context, uuid).thenApply(o -> {
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

  @GraphQLQuery(name = "advisorOrg")
  public CompletableFuture<Organization> loadAdvisorOrg(
      @GraphQLRootContext GraphQLContext context) {
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

  @GraphQLQuery(name = "interlocutorOrg")
  public CompletableFuture<Organization> loadInterlocutorOrg(
      @GraphQLRootContext GraphQLContext context) {
    if (interlocutorOrg.hasForeignObject()) {
      return CompletableFuture.completedFuture(interlocutorOrg.getForeignObject());
    }
    return new UuidFetcher<Organization>()
        .load(context, IdDataLoaderKey.ORGANIZATIONS, interlocutorOrg.getForeignUuid())
        .thenApply(o -> {
          interlocutorOrg.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setInterlocutorOrgUuid(String interlocutorOrgUuid) {
    this.interlocutorOrg = new ForeignObjectHolder<>(interlocutorOrgUuid);
  }

  @JsonIgnore
  public String getInterlocutorOrgUuid() {
    return interlocutorOrg.getForeignUuid();
  }

  public Organization getInterlocutorOrg() {
    return interlocutorOrg.getForeignObject();
  }

  @GraphQLInputField(name = "interlocutorOrg")
  public void setInterlocutorOrg(Organization interlocutorOrg) {
    this.interlocutorOrg = new ForeignObjectHolder<>(interlocutorOrg);
  }

  // TODO: batch load? (used in reports/{Minimal,Show}.js
  @GraphQLQuery(name = "comments")
  public synchronized List<Comment> loadComments() {
    if (comments == null) {
      comments = engine().getCommentDao().getCommentsForReport(uuid);
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

  public CompletableFuture<List<ApprovalStep>> computeApprovalSteps(GraphQLContext context,
      AnetObjectEngine engine) {
    final String advisorOrgUuid = getAdvisorOrgUuid();
    // First organization workflow
    return getOrganizationWorkflow(context, engine, advisorOrgUuid).thenCompose(steps -> {
      if (Utils.isEmptyOrNull(steps)) {
        final String defaultOrgUuid = engine().getAdminDao().getDefaultOrgUuid();
        if (advisorOrgUuid == null || !Objects.equals(advisorOrgUuid, defaultOrgUuid)) {
          return getDefaultOrganizationWorkflow(context, engine, defaultOrgUuid);
        }
      }
      return CompletableFuture.completedFuture(steps);
    }).thenCompose(steps -> {
      // Then tasks workflow
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
    }).thenCompose(steps -> {
      // Then location workflow
      final String locationUuid = getLocationUuid();
      if (locationUuid == null) {
        return CompletableFuture.completedFuture(steps);
      } else {
        return getLocationWorkflow(context, engine, locationUuid)
            .thenCompose(locationApprovalSteps -> {
              steps.addAll(locationApprovalSteps);
              return CompletableFuture.completedFuture(steps);
            });
      }
    }).thenCompose(steps -> {
      @SuppressWarnings("unchecked")
      final CompletableFuture<ApprovalStep>[] allSteps =
          (CompletableFuture<ApprovalStep>[]) steps.stream()
              .map(step -> getFilteredStep(context, step)).toArray(CompletableFuture<?>[]::new);
      return CompletableFuture.allOf(allSteps).thenCompose(v -> {
        final List<ApprovalStep> filteredSteps = new ArrayList<>();
        for (final CompletableFuture<ApprovalStep> cas : allSteps) {
          final ApprovalStep as = cas.join();
          if (as != null) {
            filteredSteps.add(as);
          }
        }
        return CompletableFuture.completedFuture(filteredSteps);
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
      @GraphQLRootContext GraphQLContext context) {
    if (workflow != null) {
      return CompletableFuture.completedFuture(workflow);
    }
    final AnetObjectEngine engine = engine();
    return engine().getReportActionDao().getActionsForReport(context, uuid).thenCompose(actions -> {
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

  private List<ReportAction> createApprovalStepsActions(List<ReportAction> actions,
      List<ApprovalStep> steps) {
    return steps.stream().map(step -> createApprovalStep(actions, step)).filter(as -> as != null)
        .map(as -> {
          // There is no action for this step, create a new one and attach this step
          final ReportAction action = new ReportAction();
          action.setStep(as);
          return action;
        }).collect(Collectors.toList());
  }

  private ApprovalStep createApprovalStep(List<ReportAction> actions, ApprovalStep step) {
    // Check if there are report actions for this step
    final Optional<ReportAction> existing =
        actions.stream().filter(a -> Objects.equals(DaoUtils.getUuid(step), a.getStepUuid()))
            .max(Comparator.comparing(AbstractAnetBean::getCreatedAt));
    return existing.isPresent() ? null : step;
  }

  private CompletableFuture<ApprovalStep> getFilteredStep(GraphQLContext context,
      ApprovalStep step) {
    if (!step.isRestrictedApproval()) {
      return CompletableFuture.completedFuture(step);
    }
    return step.loadApprovers(context).thenCompose(approvers -> {
      final AnetObjectEngine engine = engine();
      @SuppressWarnings("unchecked")
      final CompletableFuture<Boolean>[] allApprovers =
          (CompletableFuture<Boolean>[]) approvers.stream()
              .map(approverPosition -> engine.canUserApproveStep(context,
                  approverPosition.getPersonUuid(), step, getAdvisorOrgUuid()))
              .toArray(CompletableFuture<?>[]::new);
      return CompletableFuture.allOf(allApprovers).thenCompose(v -> {
        final List<Position> filteredApprovers = new ArrayList<>();
        for (int i = 0; i < allApprovers.length; i++) {
          if (allApprovers[i].join()) {
            filteredApprovers.add(approvers.get(i));
          }
        }
        if (filteredApprovers.isEmpty()
            && !Objects.equals(getApprovalStepUuid(), DaoUtils.getUuid(step))) {
          // No actual approvers, and step is not the current approval step: step does not apply
          return CompletableFuture.completedFuture(null);
        } else {
          // Copy the step, but with the approvers filtered to those who can actually approve (might
          // be empty)
          final ApprovalStep filteredStep = step.clone();
          filteredStep.setApprovers(filteredApprovers);
          return CompletableFuture.completedFuture(filteredStep);
        }
      });
    });
  }

  private CompletableFuture<List<ApprovalStep>> getOrganizationWorkflow(GraphQLContext context,
      AnetObjectEngine engine, String advisorOrgUuid) {
    if (advisorOrgUuid == null) {
      // No more parents, return empty steps
      return CompletableFuture.completedFuture(new ArrayList<>());
    }

    final CompletableFuture<List<ApprovalStep>> orgStepsFuture =
        isFutureEngagement() ? getPlanningWorkflowForRelatedObject(context, engine, advisorOrgUuid)
            : getWorkflowForRelatedObject(context, engine, advisorOrgUuid);

    return orgStepsFuture.thenCompose(orgSteps -> {
      if (!orgSteps.isEmpty()) {
        // Return approval steps of parent
        return CompletableFuture.completedFuture(orgSteps);
      }
      // Keep looking in the parent organization
      return new UuidFetcher<Organization>()
          .load(context, IdDataLoaderKey.ORGANIZATIONS, advisorOrgUuid)
          .thenCompose(o -> getOrganizationWorkflow(context, engine, o.getParentOrgUuid()));
    });
  }

  private CompletableFuture<List<ApprovalStep>> getPlanningWorkflowForRelatedObject(
      GraphQLContext context, AnetObjectEngine engine, String relatedObjectUuid) {
    if (relatedObjectUuid == null) {
      return CompletableFuture.completedFuture(new ArrayList<>());
    }
    return engine().getApprovalStepDao().getPlanningApprovalStepsForRelatedObject(context,
        relatedObjectUuid);
  }

  private CompletableFuture<List<ApprovalStep>> getWorkflowForRelatedObject(GraphQLContext context,
      AnetObjectEngine engine, String relatedObjectUuid) {
    if (relatedObjectUuid == null) {
      return CompletableFuture.completedFuture(new ArrayList<>());
    }

    return engine().getApprovalStepDao().getApprovalStepsForRelatedObject(context,
        relatedObjectUuid);
  }

  private CompletableFuture<List<ApprovalStep>> getDefaultOrganizationWorkflow(
      GraphQLContext context, AnetObjectEngine engine, String defaultOrgUuid) {
    return isFutureEngagement()
        ? getPlanningWorkflowForRelatedObject(context, engine, defaultOrgUuid)
        : getWorkflowForRelatedObject(context, engine, defaultOrgUuid);
  }

  private CompletableFuture<List<ApprovalStep>> getTaskWorkflow(GraphQLContext context,
      AnetObjectEngine engine, Iterator<Task> taskIterator) {
    if (!taskIterator.hasNext()) {
      return CompletableFuture.completedFuture(new ArrayList<>());
    } else {
      final Task task = taskIterator.next();
      return (isFutureEngagement()
          ? getPlanningWorkflowForRelatedObject(context, engine, DaoUtils.getUuid(task))
          : getWorkflowForRelatedObject(context, engine, DaoUtils.getUuid(task)))
          .thenCompose(taskSteps -> getTaskWorkflow(context, engine, taskIterator)
              .thenCompose(nextTaskSteps -> {
                taskSteps.addAll(nextTaskSteps);
                return CompletableFuture.completedFuture(taskSteps);
              }));
    }
  }

  private CompletableFuture<List<ApprovalStep>> getLocationWorkflow(GraphQLContext context,
      AnetObjectEngine engine, String locationUuid) {
    return isFutureEngagement() ? getPlanningWorkflowForRelatedObject(context, engine, locationUuid)
        : getWorkflowForRelatedObject(context, engine, locationUuid);
  }

  @GraphQLQuery(name = "reportSensitiveInformation")
  public CompletableFuture<ReportSensitiveInformation> loadReportSensitiveInformation(
      @GraphQLRootContext GraphQLContext context) {
    if (reportSensitiveInformation != null) {
      return CompletableFuture.completedFuture(reportSensitiveInformation);
    }
    return engine().getReportSensitiveInformationDao()
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

  @GraphQLQuery(name = "authorizedMembers")
  public CompletableFuture<List<GenericRelatedObject>> loadAuthorizedMembers(
      @GraphQLRootContext GraphQLContext context) {
    if (authorizedMembers != null) {
      return CompletableFuture.completedFuture(authorizedMembers);
    }
    return engine().getReportDao().getAuthorizedMembers(context, this).thenApply(o -> {
      authorizedMembers = o;
      return o;
    });
  }

  @GraphQLInputField(name = "authorizedMembers")
  public void setAuthorizedMembers(List<GenericRelatedObject> authorizedMembers) {
    this.authorizedMembers = authorizedMembers;
  }

  public List<GenericRelatedObject> getAuthorizedMembers() {
    return authorizedMembers;
  }

  @JsonIgnore
  public boolean isFutureEngagement() {
    return engagementDate != null && engagementDate.isAfter(Instant.now());
  }

  @GraphQLQuery(name = "engagementStatus")
  public List<EngagementStatus> loadEngagementStatus() {
    LinkedList<EngagementStatus> statuses = new LinkedList<>();
    if (state == ReportState.CANCELLED) {
      statuses.add(EngagementStatus.CANCELLED);
    }
    statuses.add(isFutureEngagement() ? EngagementStatus.FUTURE : EngagementStatus.HAPPENED);
    return statuses;
  }

  @JsonIgnore
  public boolean isAuthor(Person user) {
    return loadAuthors(engine().getContext()).join().stream()
        .anyMatch(p -> Objects.equals(p.getUuid(), user.getUuid()));
  }

  @GraphQLQuery(name = "event")
  public CompletableFuture<Event> loadEvent(@GraphQLRootContext GraphQLContext context) {
    if (event.hasForeignObject()) {
      return CompletableFuture.completedFuture(event.getForeignObject());
    }
    return new UuidFetcher<Event>().load(context, IdDataLoaderKey.EVENTS, event.getForeignUuid())
        .thenApply(o -> {
          event.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setEventUuid(String eventUuid) {
    this.event = new ForeignObjectHolder<>(eventUuid);
  }

  @JsonIgnore
  public String getEventUuid() {
    return event.getForeignUuid();
  }

  @GraphQLInputField(name = "event")
  public void setEvent(Event event) {
    this.event = new ForeignObjectHolder<>(event);
  }

  public Event getEvent() {
    return event.getForeignObject();
  }

  @Override
  public String customFieldsKey() {
    return "fields.report.customFields";
  }

  @Override
  public String customSensitiveInformationKey() {
    return "fields.report.customSensitiveInformation";
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof final Report r)) {
      return false;
    }

    return super.equals(o) && Objects.equals(r.getUuid(), uuid)
        && Objects.equals(r.getState(), state)
        && Objects.equals(r.getApprovalStepUuid(), getApprovalStepUuid())
        && Objects.equals(r.getCreatedAt(), createdAt)
        && Objects.equals(r.getUpdatedAt(), updatedAt)
        && Objects.equals(r.getEngagementDate(), engagementDate)
        && Objects.equals(r.getDuration(), duration)
        && Objects.equals(r.getLocationUuid(), getLocationUuid())
        && Objects.equals(r.getIntent(), intent) && Objects.equals(r.getExsum(), exsum)
        && Objects.equals(r.getAtmosphere(), atmosphere)
        && Objects.equals(r.getAtmosphereDetails(), atmosphereDetails)
        && Objects.equals(r.getReportPeople(), reportPeople) && Objects.equals(r.getTasks(), tasks)
        && Objects.equals(r.getReportText(), reportText)
        && Objects.equals(r.getNextSteps(), nextSteps) && Objects.equals(r.getComments(), comments)
        && Objects.equals(r.getReportSensitiveInformation(), reportSensitiveInformation)
        && Objects.equals(r.getAuthorizedMembers(), authorizedMembers)
        && Objects.equals(r.getEvent(), getEvent());
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), uuid, state, approvalStep, createdAt, updatedAt, location,
        intent, exsum, reportPeople, tasks, reportText, nextSteps, comments, atmosphere,
        atmosphereDetails, engagementDate, duration, reportSensitiveInformation, authorizedMembers,
        event);
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

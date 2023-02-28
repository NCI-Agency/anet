package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.search.FkBatchParams;
import mil.dds.anet.beans.search.ISearchQuery;
import mil.dds.anet.beans.search.M2mBatchParams;
import mil.dds.anet.beans.search.RecursiveFkBatchParams;
import mil.dds.anet.beans.search.ReportSearchQuery;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractCustomizableAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Task extends AbstractCustomizableAnetBean
    implements RelatableObject, SubscribableObject, WithStatus {

  /** Pseudo uuid to represent 'no task'. */
  public static final String DUMMY_TASK_UUID = "-1";

  @GraphQLQuery
  @GraphQLInputField
  private Instant plannedCompletion;
  @GraphQLQuery
  @GraphQLInputField
  private Instant projectedCompletion;
  @GraphQLQuery
  @GraphQLInputField
  private String shortName;
  @GraphQLQuery
  @GraphQLInputField
  private String longName;
  @GraphQLQuery
  @GraphQLInputField
  private String category;
  @GraphQLQuery
  @GraphQLInputField
  private String customField;
  @GraphQLQuery
  @GraphQLInputField
  private String customFieldEnum1;
  @GraphQLQuery
  @GraphQLInputField
  private String customFieldEnum2;
  // annotated below
  private ForeignObjectHolder<Task> parentTask = new ForeignObjectHolder<>();
  @GraphQLQuery
  @GraphQLInputField
  private Status status;
  // annotated below
  private List<Position> responsiblePositions;
  // annotated below
  private List<Organization> taskedOrganizations;
  /* The following are all Lazy Loaded */
  // annotated below
  List<ApprovalStep> planningApprovalSteps; /* Planning approval process for this Task */
  // annotated below
  List<ApprovalStep> approvalSteps; /* Approval process for this Task */

  public void setPlannedCompletion(Instant plannedCompletion) {
    this.plannedCompletion = plannedCompletion;
  }

  public Instant getPlannedCompletion() {
    return plannedCompletion;
  }

  public void setProjectedCompletion(Instant projectedCompletion) {
    this.projectedCompletion = projectedCompletion;
  }

  public Instant getProjectedCompletion() {
    return projectedCompletion;
  }

  public String getShortName() {
    return shortName;
  }

  public void setShortName(String shortName) {
    this.shortName = Utils.trimStringReturnNull(shortName);
  }

  public String getLongName() {
    return longName;
  }

  public void setLongName(String longName) {
    this.longName = Utils.trimStringReturnNull(longName);
  }

  public String getCustomField() {
    return customField;
  }

  public void setCustomField(String customField) {
    this.customField = Utils.trimStringReturnNull(customField);
  }

  public String getCustomFieldEnum1() {
    return customFieldEnum1;
  }

  public void setCustomFieldEnum1(String customFieldEnum1) {
    this.customFieldEnum1 = Utils.trimStringReturnNull(customFieldEnum1);
  }

  public String getCustomFieldEnum2() {
    return customFieldEnum2;
  }

  public void setCustomFieldEnum2(String customFieldEnum2) {
    this.customFieldEnum2 = Utils.trimStringReturnNull(customFieldEnum2);
  }

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = Utils.trimStringReturnNull(category);
  }

  @GraphQLQuery(name = "parentTask")
  public CompletableFuture<Task> loadParentTask(@GraphQLRootContext Map<String, Object> context) {
    if (parentTask.hasForeignObject()) {
      return CompletableFuture.completedFuture(parentTask.getForeignObject());
    }
    return new UuidFetcher<Task>().load(context, IdDataLoaderKey.TASKS, parentTask.getForeignUuid())
        .thenApply(o -> {
          parentTask.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setParentTaskUuid(String parentTaskUuid) {
    this.parentTask = new ForeignObjectHolder<>(parentTaskUuid);
  }

  @JsonIgnore
  public String getParentTaskUuid() {
    return parentTask.getForeignUuid();
  }

  @GraphQLInputField(name = "parentTask")
  public void setParentTask(Task parentTask) {
    this.parentTask = new ForeignObjectHolder<>(parentTask);
  }

  public Task getParentTask() {
    return parentTask.getForeignObject();
  }

  @Override
  public Status getStatus() {
    return status;
  }

  @Override
  public void setStatus(Status status) {
    this.status = status;
  }

  @GraphQLQuery(name = "reports")
  public CompletableFuture<List<Report>> loadReports(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") ReportSearchQuery query) {
    if (query == null) {
      query = new ReportSearchQuery();
    }
    query.setBatchParams(new M2mBatchParams<Report, ReportSearchQuery>("reports", "\"reportTasks\"",
        "\"reportUuid\"", "\"taskUuid\""));
    query.setUser(DaoUtils.getUserFromContext(context));
    return AnetObjectEngine.getInstance().getReportDao().getReportsBySearch(context, uuid, query);
  }

  @GraphQLQuery(name = "responsiblePositions")
  public CompletableFuture<List<Position>> loadResponsiblePositions(
      @GraphQLRootContext Map<String, Object> context) {
    if (responsiblePositions != null) {
      return CompletableFuture.completedFuture(responsiblePositions);
    }
    return AnetObjectEngine.getInstance().getTaskDao().getResponsiblePositionsForTask(context, uuid)
        .thenApply(o -> {
          responsiblePositions = o;
          return o;
        });
  }

  public List<Position> getResponsiblePositions() {
    return responsiblePositions;
  }

  @GraphQLInputField(name = "responsiblePositions")
  public void setResponsiblePositions(List<Position> positions) {
    this.responsiblePositions = positions;
  }

  @GraphQLQuery(name = "taskedOrganizations")
  public CompletableFuture<List<Organization>> loadTaskedOrganizations(
      @GraphQLRootContext Map<String, Object> context) {
    if (taskedOrganizations != null) {
      return CompletableFuture.completedFuture(taskedOrganizations);
    }
    return AnetObjectEngine.getInstance().getTaskDao().getTaskedOrganizationsForTask(context, uuid)
        .thenApply(o -> {
          taskedOrganizations = o;
          return o;
        });
  }

  public List<Organization> getTaskedOrganizations() {
    return taskedOrganizations;
  }

  @GraphQLInputField(name = "taskedOrganizations")
  public void setTaskedOrganizations(List<Organization> organizations) {
    this.taskedOrganizations = organizations;
  }

  @GraphQLQuery(name = "planningApprovalSteps")
  public CompletableFuture<List<ApprovalStep>> loadPlanningApprovalSteps(
      @GraphQLRootContext Map<String, Object> context) {
    if (planningApprovalSteps != null) {
      return CompletableFuture.completedFuture(planningApprovalSteps);
    }
    return AnetObjectEngine.getInstance().getPlanningApprovalStepsForRelatedObject(context, uuid)
        .thenApply(o -> {
          planningApprovalSteps = o;
          return o;
        });
  }

  public List<ApprovalStep> getPlanningApprovalSteps() {
    return planningApprovalSteps;
  }

  @GraphQLInputField(name = "planningApprovalSteps")
  public void setPlanningApprovalSteps(List<ApprovalStep> steps) {
    this.planningApprovalSteps = steps;
  }

  @GraphQLQuery(name = "approvalSteps")
  public CompletableFuture<List<ApprovalStep>> loadApprovalSteps(
      @GraphQLRootContext Map<String, Object> context) {
    if (approvalSteps != null) {
      return CompletableFuture.completedFuture(approvalSteps);
    }
    return AnetObjectEngine.getInstance().getApprovalStepsForRelatedObject(context, uuid)
        .thenApply(o -> {
          approvalSteps = o;
          return o;
        });
  }

  public List<ApprovalStep> getApprovalSteps() {
    return approvalSteps;
  }

  @GraphQLInputField(name = "approvalSteps")
  public void setApprovalSteps(List<ApprovalStep> steps) {
    this.approvalSteps = steps;
  }

  @GraphQLQuery(name = "childrenTasks")
  public CompletableFuture<List<Task>> loadChildrenTasks(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") TaskSearchQuery query) {
    if (query == null) {
      query = new TaskSearchQuery();
    }
    // Note: no recursion, only direct children!
    query.setBatchParams(new FkBatchParams<Task, TaskSearchQuery>("tasks", "\"parentTaskUuid\""));
    return AnetObjectEngine.getInstance().getTaskDao().getTasksBySearch(context, uuid, query);
  }

  @GraphQLQuery(name = "descendantTasks")
  public CompletableFuture<List<Task>> loadDescendantTasks(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") TaskSearchQuery query) {
    if (query == null) {
      query = new TaskSearchQuery();
    }
    // Note: recursion, includes transitive children!
    query.setBatchParams(
        new RecursiveFkBatchParams<Task, TaskSearchQuery>("tasks", "\"parentTaskUuid\"", "tasks",
            "\"parentTaskUuid\"", ISearchQuery.RecurseStrategy.CHILDREN));
    return AnetObjectEngine.getInstance().getTaskDao().getTasksBySearch(context, uuid, query);
  }

  @GraphQLQuery(name = "ascendantTasks")
  public CompletableFuture<List<Task>> loadAscendantTasks(
      @GraphQLRootContext Map<String, Object> context,
      @GraphQLArgument(name = "query") TaskSearchQuery query) {
    if (query == null) {
      query = new TaskSearchQuery();
    }
    // Note: recursion, includes transitive parents!
    query.setBatchParams(new RecursiveFkBatchParams<Task, TaskSearchQuery>("tasks", "uuid", "tasks",
        "\"parentTaskUuid\"", ISearchQuery.RecurseStrategy.PARENTS));
    return AnetObjectEngine.getInstance().getTaskDao().getTasksBySearch(context, uuid, query);
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof Task)) {
      return false;
    }
    final Task other = (Task) o;
    return super.equals(o) && Objects.equals(other.getUuid(), uuid)
        && Objects.equals(other.getShortName(), shortName)
        && Objects.equals(other.getLongName(), longName)
        && Objects.equals(other.getCategory(), category)
        && Objects.equals(other.getParentTaskUuid(), getParentTaskUuid())
        && Objects.equals(other.getStatus(), status);
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), uuid, shortName, longName, category, parentTask, status);
  }

  @Override
  public String toString() {
    return String.format("[uuid:%s shortName:%s category:%s parentTask:%s]", uuid, shortName,
        category, getParentTaskUuid());
  }

}

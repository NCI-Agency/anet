package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class TaskSearchQuery extends SubscribableObjectSearchQuery<TaskSearchSortBy> {

  // Find tasks that are (not) assigned to one or more Organizations
  @GraphQLQuery
  @GraphQLInputField
  private Boolean isAssigned;
  @GraphQLQuery
  @GraphQLInputField
  private List<String> taskedOrgUuid;
  @GraphQLQuery
  @GraphQLInputField
  private RecurseStrategy orgRecurseStrategy;
  @GraphQLQuery
  @GraphQLInputField
  private String category;
  @GraphQLQuery
  @GraphQLInputField
  private Instant plannedCompletionEnd;
  @GraphQLQuery
  @GraphQLInputField
  private Instant plannedCompletionStart;
  @GraphQLQuery
  @GraphQLInputField
  private Instant projectedCompletionEnd;
  @GraphQLQuery
  @GraphQLInputField
  private Instant projectedCompletionStart;
  // Find tasks who (don't) have the parentTask filled in
  @GraphQLQuery
  @GraphQLInputField
  private Boolean hasParentTask;
  // Search for tasks with one of the given parent Task(s)
  @GraphQLQuery
  @GraphQLInputField
  private List<String> parentTaskUuid;
  // Include descendants recursively from the specified parent(s).
  // If true will include all tasks in the tree of the parent Task(s)
  // Including the parent Task(s).
  @GraphQLQuery
  @GraphQLInputField
  private RecurseStrategy parentTaskRecurseStrategy;
  @GraphQLQuery
  @GraphQLInputField
  private String responsiblePositionUuid;

  public TaskSearchQuery() {
    super(TaskSearchSortBy.NAME);
  }

  public Boolean getIsAssigned() {
    return isAssigned;
  }

  public void setIsAssigned(final Boolean isAssigned) {
    this.isAssigned = isAssigned;
  }

  public List<String> getTaskedOrgUuid() {
    return taskedOrgUuid;
  }

  public void setTaskedOrgUuid(List<String> taskedOrgUuid) {
    this.taskedOrgUuid = taskedOrgUuid;
  }

  public RecurseStrategy getOrgRecurseStrategy() {
    return orgRecurseStrategy;
  }

  public void setOrgRecurseStrategy(RecurseStrategy orgRecurseStrategy) {
    this.orgRecurseStrategy = orgRecurseStrategy;
  }

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  public Instant getPlannedCompletionEnd() {
    return plannedCompletionEnd;
  }

  public void setPlannedCompletionEnd(Instant plannedCompletionEnd) {
    this.plannedCompletionEnd = plannedCompletionEnd;
  }

  public Instant getPlannedCompletionStart() {
    return plannedCompletionStart;
  }

  public void setPlannedCompletionStart(Instant plannedCompletionStart) {
    this.plannedCompletionStart = plannedCompletionStart;
  }

  public Instant getProjectedCompletionEnd() {
    return projectedCompletionEnd;
  }

  public void setProjectedCompletionEnd(Instant projectedCompletionEnd) {
    this.projectedCompletionEnd = projectedCompletionEnd;
  }

  public Instant getProjectedCompletionStart() {
    return projectedCompletionStart;
  }

  public void setProjectedCompletionStart(Instant projectedCompletionStart) {
    this.projectedCompletionStart = projectedCompletionStart;
  }

  public Boolean getHasParentTask() {
    return hasParentTask;
  }

  public void setHasParentTask(Boolean hasParentTask) {
    this.hasParentTask = hasParentTask;
  }

  public List<String> getParentTaskUuid() {
    return parentTaskUuid;
  }

  public void setParentTaskUuid(List<String> parentTaskUuid) {
    this.parentTaskUuid = parentTaskUuid;
  }

  public RecurseStrategy getParentTaskRecurseStrategy() {
    return parentTaskRecurseStrategy;
  }

  public void setParentTaskRecurseStrategy(RecurseStrategy parentTaskRecurseStrategy) {
    this.parentTaskRecurseStrategy = parentTaskRecurseStrategy;
  }

  public String getResponsiblePositionUuid() {
    return responsiblePositionUuid;
  }

  public void setResponsiblePositionUuid(String responsiblePositionUuid) {
    this.responsiblePositionUuid = responsiblePositionUuid;
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), isAssigned, taskedOrgUuid, orgRecurseStrategy, category,
        plannedCompletionEnd, plannedCompletionStart, projectedCompletionEnd,
        projectedCompletionStart, parentTaskUuid, parentTaskRecurseStrategy,
        responsiblePositionUuid);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof TaskSearchQuery)) {
      return false;
    }
    final TaskSearchQuery other = (TaskSearchQuery) obj;
    return super.equals(obj) && Objects.equals(getIsAssigned(), other.getIsAssigned())
        && Objects.equals(getTaskedOrgUuid(), other.getTaskedOrgUuid())
        && Objects.equals(getOrgRecurseStrategy(), other.getOrgRecurseStrategy())
        && Objects.equals(getCategory(), other.getCategory())
        && Objects.equals(getPlannedCompletionEnd(), other.getPlannedCompletionEnd())
        && Objects.equals(getPlannedCompletionStart(), other.getPlannedCompletionStart())
        && Objects.equals(getProjectedCompletionEnd(), other.getProjectedCompletionEnd())
        && Objects.equals(getProjectedCompletionStart(), other.getProjectedCompletionStart())
        && Objects.equals(getParentTaskUuid(), other.getParentTaskUuid())
        && Objects.equals(getParentTaskRecurseStrategy(), other.getParentTaskRecurseStrategy())
        && Objects.equals(getResponsiblePositionUuid(), other.getResponsiblePositionUuid());
  }

  @Override
  public TaskSearchQuery clone() throws CloneNotSupportedException {
    final TaskSearchQuery clone = (TaskSearchQuery) super.clone();
    if (parentTaskUuid != null) {
      clone.setParentTaskUuid(new ArrayList<>(parentTaskUuid));
    }
    if (taskedOrgUuid != null) {
      clone.setTaskedOrgUuid(new ArrayList<>(taskedOrgUuid));
    }
    return clone;
  }

}

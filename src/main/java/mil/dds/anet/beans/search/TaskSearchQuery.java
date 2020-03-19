package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import mil.dds.anet.beans.Task.TaskStatus;

public class TaskSearchQuery extends SubscribableObjectSearchQuery<TaskSearchSortBy> {

  @GraphQLQuery
  @GraphQLInputField
  private String taskedOrgUuid;
  @GraphQLQuery
  @GraphQLInputField
  private RecurseStrategy orgRecurseStrategy;
  @GraphQLQuery
  @GraphQLInputField
  private String category;
  @GraphQLQuery
  @GraphQLInputField
  private TaskStatus status;
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
  @GraphQLQuery
  @GraphQLInputField
  private String projectStatus;
  @GraphQLQuery
  @GraphQLInputField
  private String customField;
  // Find tasks who (don't) have the customFieldRef1 filled in
  @GraphQLQuery
  @GraphQLInputField
  private Boolean hasCustomFieldRef1;
  // Search for tasks with one of the given parent Task(s)
  @GraphQLQuery
  @GraphQLInputField
  private List<String> customFieldRef1Uuid;
  // Include descendants recursively from the specified parent(s).
  // If true will include all tasks in the tree of the parent Task(s)
  // Including the parent Task(s).
  @GraphQLQuery
  @GraphQLInputField
  private Boolean customFieldRef1Recursively;

  public TaskSearchQuery() {
    super(TaskSearchSortBy.NAME);
  }

  public String getTaskedOrgUuid() {
    return taskedOrgUuid;
  }

  public void setTaskedOrgUuid(String taskedOrgUuid) {
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

  public TaskStatus getStatus() {
    return status;
  }

  public void setStatus(TaskStatus status) {
    this.status = status;
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

  public String getProjectStatus() {
    return projectStatus;
  }

  public void setProjectStatus(String projectStatus) {
    this.projectStatus = projectStatus;
  }

  public String getCustomField() {
    return customField;
  }

  public void setCustomField(String customField) {
    this.customField = customField;
  }

  public Boolean getHasCustomFieldRef1() {
    return hasCustomFieldRef1;
  }

  public void setHasCustomFieldRef1(Boolean hasCustomFieldRef1) {
    this.hasCustomFieldRef1 = hasCustomFieldRef1;
  }

  public List<String> getCustomFieldRef1Uuid() {
    return customFieldRef1Uuid;
  }

  public void setCustomFieldRef1Uuid(List<String> customFieldRef1Uuid) {
    this.customFieldRef1Uuid = customFieldRef1Uuid;
  }

  public boolean getCustomFieldRef1Recursively() {
    return Boolean.TRUE.equals(customFieldRef1Recursively);
  }

  public void setCustomFieldRef1Recursively(Boolean customFieldRef1Recursively) {
    this.customFieldRef1Recursively = customFieldRef1Recursively;
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), taskedOrgUuid, orgRecurseStrategy, category, status,
        plannedCompletionEnd, plannedCompletionStart, projectedCompletionEnd,
        projectedCompletionStart, projectStatus, customField, customFieldRef1Uuid,
        customFieldRef1Recursively);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof TaskSearchQuery)) {
      return false;
    }
    final TaskSearchQuery other = (TaskSearchQuery) obj;
    return super.equals(obj) && Objects.equals(getTaskedOrgUuid(), other.getTaskedOrgUuid())
        && Objects.equals(getOrgRecurseStrategy(), other.getOrgRecurseStrategy())
        && Objects.equals(getCategory(), other.getCategory())
        && Objects.equals(getStatus(), other.getStatus())
        && Objects.equals(getPlannedCompletionEnd(), other.getPlannedCompletionEnd())
        && Objects.equals(getPlannedCompletionStart(), other.getPlannedCompletionStart())
        && Objects.equals(getProjectedCompletionEnd(), other.getProjectedCompletionEnd())
        && Objects.equals(getProjectedCompletionStart(), other.getProjectedCompletionStart())
        && Objects.equals(getProjectStatus(), other.getProjectStatus())
        && Objects.equals(getCustomField(), other.getCustomField())
        && Objects.equals(getCustomFieldRef1Uuid(), other.getCustomFieldRef1Uuid())
        && Objects.equals(getCustomFieldRef1Recursively(), other.getCustomFieldRef1Recursively());
  }

}

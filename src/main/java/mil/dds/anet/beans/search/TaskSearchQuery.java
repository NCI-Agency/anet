package mil.dds.anet.beans.search;

import java.time.Instant;
import mil.dds.anet.beans.Task.TaskStatus;

public class TaskSearchQuery extends AbstractSearchQuery<TaskSearchSortBy> {

  private String responsibleOrgUuid;
  private Boolean includeChildrenOrgs;
  private String category;
  private TaskStatus status;
  private Instant plannedCompletionEnd;
  private Instant plannedCompletionStart;
  private Instant projectedCompletionEnd;
  private Instant projectedCompletionStart;
  private String projectStatus;
  private String customField;

  // Search for tasks with a specific parent Task.
  private String customFieldRef1Uuid;
  // Include descendants recursively from the specified parent.
  // If true will include all tasks in the tree of the parent Task
  // Including the parent Task.
  private Boolean customFieldRef1Recursively;

  public TaskSearchQuery() {
    super(TaskSearchSortBy.NAME);
  }

  public String getResponsibleOrgUuid() {
    return responsibleOrgUuid;
  }

  public void setResponsibleOrgUuid(String responsibleOrgUuid) {
    this.responsibleOrgUuid = responsibleOrgUuid;
  }

  public Boolean getIncludeChildrenOrgs() {
    return Boolean.TRUE.equals(includeChildrenOrgs);
  }

  public void setIncludeChildrenOrgs(Boolean includeChildrenOrgs) {
    this.includeChildrenOrgs = includeChildrenOrgs;
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

  public String getCustomFieldRef1Uuid() {
    return customFieldRef1Uuid;
  }

  public void setCustomFieldRef1Uuid(String customFieldRef1Uuid) {
    this.customFieldRef1Uuid = customFieldRef1Uuid;
  }

  public Boolean getCustomFieldRef1Recursively() {
    return customFieldRef1Recursively;
  }

  public void setCustomFieldRef1Recursively(Boolean customFieldRef1Recursively) {
    this.customFieldRef1Recursively = customFieldRef1Recursively;
  }

}

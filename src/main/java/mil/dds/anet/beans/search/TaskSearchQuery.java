package mil.dds.anet.beans.search;

import java.time.Instant;

import mil.dds.anet.beans.Task.TaskStatus;

public class TaskSearchQuery extends AbstractSearchQuery {

	public enum TaskSearchSortBy { CREATED_AT, NAME, CATEGORY }

	String responsibleOrgUuid;
	Boolean includeChildrenOrgs;
	String category;
	TaskStatus status;
	private Instant plannedCompletionEnd;
	private Instant plannedCompletionStart;
	private Instant projectedCompletionEnd;
	private Instant projectedCompletionStart;
	private String projectStatus;
	private String customField;

	private TaskSearchSortBy sortBy;
	private SortOrder sortOrder;

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

	public TaskSearchSortBy getSortBy() {
		return sortBy;
	}

	public void setSortBy(TaskSearchSortBy sortBy) {
		this.sortBy = sortBy;
	}

	public SortOrder getSortOrder() {
		return sortOrder;
	}

	public void setSortOrder(SortOrder sortOrder) {
		this.sortOrder = sortOrder;
	}

	public static TaskSearchQuery withText(String text, int pageNum, int pageSize) {
		TaskSearchQuery query = new TaskSearchQuery();
		query.setText(text);
		query.setPageNum(pageNum);
		query.setPageSize(pageSize);
		return query;
	}

}

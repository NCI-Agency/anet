package mil.dds.anet.beans.search;

import mil.dds.anet.beans.Task.TaskStatus;

public class TaskSearchQuery extends AbstractSearchQuery {

	Integer responsibleOrgId;
	Boolean includeChildrenOrgs;
	String category;
	TaskStatus status;

	public Integer getResponsibleOrgId() {
		return responsibleOrgId;
	}

	public void setResponsibleOrgId(Integer responsibleOrgId) {
		this.responsibleOrgId = responsibleOrgId;
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

	public static TaskSearchQuery withText(String text, int pageNum, int pageSize) {
		TaskSearchQuery query = new TaskSearchQuery();
		query.setText(text);
		query.setPageNum(pageNum);
		query.setPageSize(pageSize);
		return query;
	}

}

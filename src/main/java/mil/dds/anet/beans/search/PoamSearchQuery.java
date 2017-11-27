package mil.dds.anet.beans.search;

import mil.dds.anet.beans.Poam.PoamStatus;

public class PoamSearchQuery extends AbstractSearchQuery {

	Integer responsibleOrgId;
	Boolean includeChildrenOrgs;
	String category;
	PoamStatus status;

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

	public PoamStatus getStatus() {
		return status;
	}

	public void setStatus(PoamStatus status) {
		this.status = status;
	}

	public static PoamSearchQuery withText(String text, int pageNum, int pageSize) {
		PoamSearchQuery query = new PoamSearchQuery();
		query.setText(text);
		query.setPageNum(pageNum);
		query.setPageSize(pageSize);
		return query;
	}

}

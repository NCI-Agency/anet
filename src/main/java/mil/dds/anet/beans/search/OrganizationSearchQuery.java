package mil.dds.anet.beans.search;

import mil.dds.anet.beans.Organization.OrganizationType;

public class OrganizationSearchQuery extends AbstractSearchQuery {

	OrganizationType type;
	
	//Search for organizations with a specific parent Org. 
	Integer parentOrgId;
	//Include descedants recursively from the specified parent. 
	//If true will include all orgs in the tree of the parentOrg
	// Including the parent Org. 
	Boolean parentOrgRecursively;
	
	public OrganizationType getType() {
		return type;
	}
	
	public void setType(OrganizationType type) {
		this.type = type;
	}
	
	public Integer getParentOrgId() {
		return parentOrgId;
	}

	public void setParentOrgId(Integer parentOrgId) {
		this.parentOrgId = parentOrgId;
	}

	public Boolean getParentOrgRecursively() {
		return parentOrgRecursively;
	}

	public void setParentOrgRecursively(Boolean parentOrgRecursively) {
		this.parentOrgRecursively = parentOrgRecursively;
	}

	public static OrganizationSearchQuery withText(String text, int pageNum, int pageSize) {
		OrganizationSearchQuery query = new OrganizationSearchQuery();
		query.setText(text);
		query.setPageNum(pageNum);
		query.setPageSize(pageSize);
		return query;
	}

}

package mil.dds.anet.beans.search;

import mil.dds.anet.beans.Organization.OrganizationStatus;
import mil.dds.anet.beans.Organization.OrganizationType;

public class OrganizationSearchQuery extends SubscribableObjectSearchQuery {

	public enum OrganizationSearchSortBy { CREATED_AT, NAME, TYPE }

	private OrganizationStatus status;
	private OrganizationType type;

	// Search for organizations with a specific parent Org.
	private String parentOrgUuid;
	// Include descendants recursively from the specified parent.
	// If true will include all orgs in the tree of the parentOrg
	// Including the parent Org.
	private Boolean parentOrgRecursively;

	private OrganizationSearchSortBy sortBy;
	private SortOrder sortOrder;

	public OrganizationStatus getStatus() {
		return status;
	}

	public void setStatus(OrganizationStatus status) {
		this.status = status;
	}

	public OrganizationType getType() {
		return type;
	}
	
	public void setType(OrganizationType type) {
		this.type = type;
	}
	
	public String getParentOrgUuid() {
		return parentOrgUuid;
	}

	public void setParentOrgUuid(String parentOrgUuid) {
		this.parentOrgUuid = parentOrgUuid;
	}

	public Boolean getParentOrgRecursively() {
		return parentOrgRecursively;
	}

	public void setParentOrgRecursively(Boolean parentOrgRecursively) {
		this.parentOrgRecursively = parentOrgRecursively;
	}

	public OrganizationSearchSortBy getSortBy() {
		return sortBy;
	}

	public void setSortBy(OrganizationSearchSortBy sortBy) {
		this.sortBy = sortBy;
	}

	public SortOrder getSortOrder() {
		return sortOrder;
	}

	public void setSortOrder(SortOrder sortOrder) {
		this.sortOrder = sortOrder;
	}

	public static OrganizationSearchQuery withText(String text, int pageNum, int pageSize) {
		OrganizationSearchQuery query = new OrganizationSearchQuery();
		query.setText(text);
		query.setPageNum(pageNum);
		query.setPageSize(pageSize);
		return query;
	}

}

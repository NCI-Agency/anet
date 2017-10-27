package mil.dds.anet.beans.search;

import java.util.List;

import mil.dds.anet.beans.Position.PositionStatus;
import mil.dds.anet.beans.Position.PositionType;

public class PositionSearchQuery extends AbstractSearchQuery {

	public enum PositionSearchSortBy { NAME, CODE, CREATED_AT }

	Boolean matchPersonName;
	Integer organizationId;
	Boolean includeChildrenOrgs;
	List<PositionType> type;
	Boolean isFilled;
	Integer locationId;
	PositionStatus status;
	
	PositionSearchSortBy sortBy;
	SortOrder sortOrder;

	public PositionSearchQuery() {
		super();
		this.matchPersonName = false;
	}

	public Boolean getMatchPersonName() {
		return matchPersonName == null ? false : matchPersonName;
	}
	
	public void setMatchPersonName(Boolean matchPersonName) {
		this.matchPersonName = matchPersonName;
	}
	
	public Integer getOrganizationId() {
		return organizationId;
	}
	
	public void setOrganizationId(Integer orgId) {
		this.organizationId = orgId;
	}
	
	public Boolean getIncludeChildrenOrgs() {
		return includeChildrenOrgs;
	}
	
	public void setIncludeChildrenOrgs(Boolean includeChildrenOrgs) {
		this.includeChildrenOrgs = includeChildrenOrgs;
	}
	
	public List<PositionType> getType() {
		return type;
	}
	
	public void setType(List<PositionType> type) {
		this.type = type;
	}
	
	public Boolean getIsFilled() {
		return isFilled;
	}
	
	public void setIsFilled(Boolean isFilled) {
		this.isFilled = isFilled;
	}
	
	public Integer getLocationId() {
		return locationId;
	}
	
	public void setLocationId(Integer locationId) {
		this.locationId = locationId;
	}
	
	public PositionStatus getStatus() {
		return status;
	}

	public void setStatus(PositionStatus status) {
		this.status = status;
	}

	public PositionSearchSortBy getSortBy() {
		return sortBy;
	}

	public void setSortBy(PositionSearchSortBy sortBy) {
		this.sortBy = sortBy;
	}

	public SortOrder getSortOrder() {
		return sortOrder;
	}

	public void setSortOrder(SortOrder sortOrder) {
		this.sortOrder = sortOrder;
	}

	public static PositionSearchQuery withText(String text, int pageNum, int pageSize) {
		PositionSearchQuery query = new PositionSearchQuery();
		query.setText(text);
		query.setPageNum(pageNum);
		query.setPageSize(pageSize);
		return query;
	}

}

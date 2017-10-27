package mil.dds.anet.beans.search;

import java.util.List;

import mil.dds.anet.beans.Person.PersonStatus;
import mil.dds.anet.beans.Person.Role;

public class PersonSearchQuery extends AbstractSearchQuery {

	public enum PersonSearchSortBy { CREATED_AT, NAME, RANK }

	Integer orgId;
	Role role;
	List<PersonStatus> status;
	Boolean includeChildOrgs;
	String country;
	
	//Filter to people in positions at a certain location
	Integer locationId;
	
	//Also match on positions whose name or code matches text. 
	Boolean matchPositionName;
	
	//Find people who are pending verification
	Boolean pendingVerification;
	
	PersonSearchSortBy sortBy;
	SortOrder sortOrder;

	public Integer getOrgId() {
		return orgId;
	}

	public void setOrgId(Integer orgId) {
		this.orgId = orgId;
	}

	public Role getRole() {
		return role;
	}

	public void setRole(Role role) {
		this.role = role;
	}

	public List<PersonStatus> getStatus() {
		return status;
	}

	public void setStatus(List<PersonStatus> status) {
		this.status = status;
	}

	public Boolean getIncludeChildOrgs() {
		return includeChildOrgs;
	}

	public void setIncludeChildOrgs(Boolean includeChildOrgs) {
		this.includeChildOrgs = includeChildOrgs;
	}

	public String getCountry() {
		return country;
	}

	public void setCountry(String country) {
		this.country = country;
	}

	public Integer getLocationId() {
		return locationId;
	}

	public void setLocationId(Integer locationId) {
		this.locationId = locationId;
	}

	public Boolean getMatchPositionName() {
		return matchPositionName == null ? false : matchPositionName;
	}

	public void setMatchPositionName(Boolean matchPositionName) {
		this.matchPositionName = matchPositionName;
	}

	public Boolean getPendingVerification() {
		return pendingVerification;
	}

	public void setPendingVerification(Boolean pendingVerification) {
		this.pendingVerification = pendingVerification;
	}

	public PersonSearchSortBy getSortBy() {
		return sortBy;
	}

	public void setSortBy(PersonSearchSortBy sortBy) {
		this.sortBy = sortBy;
	}

	public SortOrder getSortOrder() {
		return sortOrder;
	}

	public void setSortOrder(SortOrder sortOrder) {
		this.sortOrder = sortOrder;
	}

	public static PersonSearchQuery withText(String text, int pageNum, int pageSize) {
		PersonSearchQuery query = new PersonSearchQuery();
		query.setText(text);
		query.setPageNum(pageNum);
		query.setPageSize(pageSize);
		return query;
	}

}

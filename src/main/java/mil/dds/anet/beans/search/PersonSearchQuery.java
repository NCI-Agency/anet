package mil.dds.anet.beans.search;

import java.util.List;

import mil.dds.anet.beans.Person.PersonStatus;
import mil.dds.anet.beans.Person.Role;

public class PersonSearchQuery extends SubscribableObjectSearchQuery {

	public enum PersonSearchSortBy { CREATED_AT, NAME, RANK }

	String orgUuid;
	Role role;
	List<PersonStatus> status;
	Boolean includeChildOrgs;
	String rank;
	String country;
	
	//Filter to people in positions at a certain location
	String locationUuid;
	
	//Also match on positions whose name or code matches text. 
	Boolean matchPositionName;
	
	//Find people who are pending verification
	Boolean pendingVerification;
	
	private PersonSearchSortBy sortBy;
	private SortOrder sortOrder;

	public PersonSearchQuery() {
		this.setPageSize(100);
		this.sortOrder = SortOrder.ASC;
		this.sortBy = PersonSearchSortBy.NAME;
	}

	public String getOrgUuid() {
		return orgUuid;
	}

	public void setOrgUuid(String orgUuid) {
		this.orgUuid = orgUuid;
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

	public String getRank() {
		return rank;
	}

	public void setRank(String rank) {
		this.rank = rank;
	}

	public String getCountry() {
		return country;
	}

	public void setCountry(String country) {
		this.country = country;
	}

	public String getLocationUuid() {
		return locationUuid;
	}

	public void setLocationUuid(String locationUuid) {
		this.locationUuid = locationUuid;
	}

	public Boolean getMatchPositionName() {
		return Boolean.TRUE.equals(matchPositionName);
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

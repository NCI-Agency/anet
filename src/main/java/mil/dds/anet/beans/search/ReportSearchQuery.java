package mil.dds.anet.beans.search;

import java.time.Instant;
import java.util.List;

import mil.dds.anet.beans.Report.Atmosphere;
import mil.dds.anet.beans.Report.ReportCancelledReason;
import mil.dds.anet.beans.Report.ReportState;

public class ReportSearchQuery extends AbstractSearchQuery {

	public enum ReportSearchSortBy { CREATED_AT, ENGAGEMENT_DATE, RELEASED_AT } 

	String authorUuid;
	Instant engagementDateStart;
	Instant engagementDateEnd;
	private Integer engagementDayOfWeek;
	private Boolean includeEngagementDayOfWeek;
	Instant createdAtStart;
	Instant createdAtEnd;
	Instant updatedAtStart;
	Instant updatedAtEnd;
	Instant releasedAtStart;
	Instant releasedAtEnd;
	String attendeeUuid;
	Atmosphere atmosphere;
	
	//Can use either orgUuid or one or both of advisorOrgUuid and principalOrgUuid
	//only use orgUuid if you don't know the type of the organization.
	String advisorOrgUuid;
	Boolean includeAdvisorOrgChildren;
	//Set principalOrgUuid or advisorOrgUuid = Organization.DUMMY_ORG_UUID to tell ANET to search for reports specifically with a NULL organizationUuid.
	String principalOrgUuid;
	Boolean includePrincipalOrgChildren;
	String orgUuid;
	Boolean includeOrgChildren;
	
	String locationUuid;
	String taskUuid;
	String pendingApprovalOf;
	List<ReportState> state;
	ReportCancelledReason cancelledReason;
	private String tagUuid;
	private String authorPositionUuid;
	private String attendeePositionUuid;
	private List<String> authorizationGroupUuid;
	private Boolean sensitiveInfo;

	private ReportSearchSortBy sortBy;
	private SortOrder sortOrder;

	public ReportSearchQuery() {
		super();
		this.sortBy = ReportSearchSortBy.CREATED_AT;
		this.sortOrder = SortOrder.DESC;
	}

	public String getAuthorUuid() {
		return authorUuid;
	}

	public void setAuthorUuid(String authorUuid) {
		this.authorUuid = authorUuid;
	}

	public Instant getEngagementDateStart() {
		return engagementDateStart;
	}

	public void setEngagementDateStart(Instant engagementDateStart) {
		this.engagementDateStart = engagementDateStart;
	}

	public Instant getEngagementDateEnd() {
		return engagementDateEnd;
	}

	public void setEngagementDateEnd(Instant engagementDateEnd) {
		this.engagementDateEnd = engagementDateEnd;
	}

	public Integer getEngagementDayOfWeek() {
		return engagementDayOfWeek;
	}

	public void setEngagementDayOfWeek(Integer engagementDayOfWeek) {
		this.engagementDayOfWeek = engagementDayOfWeek;
	}

	public boolean getIncludeEngagementDayOfWeek() {
		return Boolean.TRUE.equals(includeEngagementDayOfWeek);
	}

	public void setIncludeEngagementDayOfWeek(Boolean includeEngagementDayOfWeek) {
		this.includeEngagementDayOfWeek = includeEngagementDayOfWeek;
	}

	public Instant getCreatedAtStart() {
		return createdAtStart;
	}

	public void setCreatedAtStart(Instant createdAtStart) {
		this.createdAtStart = createdAtStart;
	}

	public Instant getCreatedAtEnd() {
		return createdAtEnd;
	}

	public void setCreatedAtEnd(Instant createdAtEnd) {
		this.createdAtEnd = createdAtEnd;
	}

	public Instant getUpdatedAtStart() {
		return updatedAtStart;
	}

	public void setUpdatedAtStart(Instant updatedAtStart) {
		this.updatedAtStart = updatedAtStart;
	}

	public Instant getUpdatedAtEnd() {
		return updatedAtEnd;
	}

	public void setUpdatedAtEnd(Instant updatedAtEnd) {
		this.updatedAtEnd = updatedAtEnd;
	}

	public Instant getReleasedAtStart() {
		return releasedAtStart;
	}

	public void setReleasedAtStart(Instant releasedAtStart) {
		this.releasedAtStart = releasedAtStart;
	}

	public Instant getReleasedAtEnd() {
		return releasedAtEnd;
	}

	public void setReleasedAtEnd(Instant releasedAtEnd) {
		this.releasedAtEnd = releasedAtEnd;
	}

	public String getAttendeeUuid() {
		return attendeeUuid;
	}

	public void setAttendeeUuid(String attendeeUuid) {
		this.attendeeUuid = attendeeUuid;
	}

	public Atmosphere getAtmosphere() {
		return atmosphere;
	}

	public void setAtmosphere(Atmosphere atmosphere) {
		this.atmosphere = atmosphere;
	}

	public String getAdvisorOrgUuid() {
		return advisorOrgUuid;
	}

	public void setAdvisorOrgUuid(String advisorOrgUuid) {
		this.advisorOrgUuid = advisorOrgUuid;
	}

	public boolean getIncludeAdvisorOrgChildren() {
		return Boolean.TRUE.equals(includeAdvisorOrgChildren);
	}

	public void setIncludeAdvisorOrgChildren(Boolean includeAdvisorOrgChildren) {
		this.includeAdvisorOrgChildren = includeAdvisorOrgChildren;
	}

	public String getPrincipalOrgUuid() {
		return principalOrgUuid;
	}

	public void setPrincipalOrgUuid(String principalOrgUuid) {
		this.principalOrgUuid = principalOrgUuid;
	}

	public boolean getIncludePrincipalOrgChildren() {
		return Boolean.TRUE.equals(includePrincipalOrgChildren);
	}

	public void setIncludePrincipalOrgChildren(Boolean includePrincipalOrgChildren) {
		this.includePrincipalOrgChildren = includePrincipalOrgChildren;
	}

	public String getOrgUuid() {
		return orgUuid;
	}

	public void setOrgUuid(String orgUuid) {
		this.orgUuid = orgUuid;
	}

	public boolean getIncludeOrgChildren() {
		return Boolean.TRUE.equals(includeOrgChildren);
	}

	public void setIncludeOrgChildren(Boolean includeOrgChildren) {
		this.includeOrgChildren = includeOrgChildren;
	}

	public String getLocationUuid() {
		return locationUuid;
	}

	public void setLocationUuid(String locationUuid) {
		this.locationUuid = locationUuid;
	}

	public String getTaskUuid() {
		return taskUuid;
	}

	public void setTaskUuid(String taskUuid) {
		this.taskUuid = taskUuid;
	}

	public String getPendingApprovalOf() {
		return pendingApprovalOf;
	}

	public void setPendingApprovalOf(String pendingApprovalOf) {
		this.pendingApprovalOf = pendingApprovalOf;
	}

	public List<ReportState> getState() {
		return state;
	}

	public void setState(List<ReportState> state) {
		this.state = state;
	}

	public ReportCancelledReason getCancelledReason() {
		return cancelledReason;
	}

	public void setCancelledReason(ReportCancelledReason cancelledReason) {
		this.cancelledReason = cancelledReason;
	}

	public String getTagUuid() {
		return tagUuid;
	}

	public void setTagUuid(String tagUuid) {
		this.tagUuid = tagUuid;
	}

	public String getAuthorPositionUuid() {
		return authorPositionUuid;
	}

	public void setAuthorPositionUuid(String authorPositionUuid) {
		this.authorPositionUuid = authorPositionUuid;
	}

	public String getAttendeePositionUuid() {
		return attendeePositionUuid;
	}

	public void setAttendeePositionUuid(String attendeePositionUuid) {
		this.attendeePositionUuid = attendeePositionUuid;
	}

	public List<String> getAuthorizationGroupUuid() {
		return authorizationGroupUuid;
	}

	public void setAuthorizationGroupUuid(List<String> authorizationGroupUuid) {
		this.authorizationGroupUuid = authorizationGroupUuid;
	}

	public boolean getSensitiveInfo() {
		return Boolean.TRUE.equals(sensitiveInfo);
	}

	public void setSensitiveInfo(Boolean sensitiveInfo) {
		this.sensitiveInfo = sensitiveInfo;
	}

	public ReportSearchSortBy getSortBy() {
		return sortBy;
	}

	public void setSortBy(ReportSearchSortBy sortBy) {
		this.sortBy = sortBy;
	}

	public SortOrder getSortOrder() {
		return sortOrder;
	}

	public void setSortOrder(SortOrder sortOrder) {
		this.sortOrder = sortOrder;
	}

	public static ReportSearchQuery withText(String text, int pageNum, int pageSize) {
		ReportSearchQuery query = new ReportSearchQuery();
		query.setText(text);
		query.setPageNum(pageNum);
		query.setPageSize(pageSize);
		return query;
	}

}

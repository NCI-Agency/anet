package mil.dds.anet.beans.search;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Report.Atmosphere;
import mil.dds.anet.beans.Report.ReportCancelledReason;
import mil.dds.anet.beans.Report.ReportState;

public class ReportSearchQuery extends AbstractSearchQuery<ReportSearchSortBy> {

  public static enum EngagementStatus {
    HAPPENED, FUTURE, CANCELLED
  }

  @GraphQLQuery
  @GraphQLInputField
  String authorUuid;
  @GraphQLQuery
  @GraphQLInputField
  Instant engagementDateStart;
  @GraphQLQuery
  @GraphQLInputField
  Instant engagementDateEnd;
  @GraphQLQuery
  @GraphQLInputField
  private Integer engagementDayOfWeek;
  @GraphQLQuery
  @GraphQLInputField
  private Boolean includeEngagementDayOfWeek;
  @GraphQLQuery
  @GraphQLInputField
  Instant createdAtStart;
  @GraphQLQuery
  @GraphQLInputField
  Instant createdAtEnd;
  @GraphQLQuery
  @GraphQLInputField
  Instant updatedAtStart;
  @GraphQLQuery
  @GraphQLInputField
  Instant updatedAtEnd;
  @GraphQLQuery
  @GraphQLInputField
  Instant releasedAtStart;
  @GraphQLQuery
  @GraphQLInputField
  Instant releasedAtEnd;
  @GraphQLQuery
  @GraphQLInputField
  String attendeeUuid;
  @GraphQLQuery
  @GraphQLInputField
  Atmosphere atmosphere;

  // Can use either orgUuid or one or both of advisorOrgUuid and principalOrgUuid
  // only use orgUuid if you don't know the type of the organization.
  @GraphQLQuery
  @GraphQLInputField
  String advisorOrgUuid;
  @GraphQLQuery
  @GraphQLInputField
  Boolean includeAdvisorOrgChildren;
  // Set principalOrgUuid or advisorOrgUuid = Organization.DUMMY_ORG_UUID to tell ANET to search for
  // reports specifically with a NULL organizationUuid.
  @GraphQLQuery
  @GraphQLInputField
  String principalOrgUuid;
  @GraphQLQuery
  @GraphQLInputField
  Boolean includePrincipalOrgChildren;
  @GraphQLQuery
  @GraphQLInputField
  String orgUuid;
  @GraphQLQuery
  @GraphQLInputField
  Boolean includeOrgChildren;

  @GraphQLQuery
  @GraphQLInputField
  String locationUuid;
  @GraphQLQuery
  @GraphQLInputField
  String taskUuid;
  @GraphQLQuery
  @GraphQLInputField
  String pendingApprovalOf;
  @GraphQLQuery
  @GraphQLInputField
  List<ReportState> state;
  @GraphQLQuery
  @GraphQLInputField
  List<EngagementStatus> engagementStatus;
  @GraphQLQuery
  @GraphQLInputField
  ReportCancelledReason cancelledReason;
  @GraphQLQuery
  @GraphQLInputField
  private String tagUuid;
  @GraphQLQuery
  @GraphQLInputField
  private String authorPositionUuid;
  @GraphQLQuery
  @GraphQLInputField
  private String attendeePositionUuid;
  @GraphQLQuery
  @GraphQLInputField
  private List<String> authorizationGroupUuid;
  @GraphQLQuery
  @GraphQLInputField
  private Boolean sensitiveInfo;
  // internal search parameters:
  private Person user;
  private boolean systemSearch;

  public ReportSearchQuery() {
    super(ReportSearchSortBy.CREATED_AT);
    this.setSortOrder(SortOrder.DESC);
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

  public List<EngagementStatus> getEngagementStatus() {
    return engagementStatus;
  }

  public void setEngagementStatus(List<EngagementStatus> engagementStatus) {
    this.engagementStatus = engagementStatus;
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

  @JsonIgnore
  public Person getUser() {
    return user;
  }

  @JsonIgnore
  public void setUser(Person user) {
    this.user = user;
  }

  @JsonIgnore
  public boolean isSystemSearch() {
    return systemSearch;
  }

  @JsonIgnore
  public void setSystemSearch(boolean systemSearch) {
    this.systemSearch = systemSearch;
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), authorUuid, engagementDateStart, engagementDateEnd,
        engagementDayOfWeek, includeEngagementDayOfWeek, createdAtStart, createdAtEnd,
        updatedAtStart, updatedAtEnd, releasedAtStart, releasedAtEnd, attendeeUuid, atmosphere,
        advisorOrgUuid, includeAdvisorOrgChildren, principalOrgUuid, includePrincipalOrgChildren,
        orgUuid, includeOrgChildren, locationUuid, taskUuid, pendingApprovalOf, state,
        engagementStatus, cancelledReason, tagUuid, authorPositionUuid, attendeePositionUuid,
        authorizationGroupUuid, sensitiveInfo, user, systemSearch);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof ReportSearchQuery)) {
      return false;
    }
    final ReportSearchQuery other = (ReportSearchQuery) obj;
    return super.equals(obj) && Objects.equals(getAuthorUuid(), other.getAuthorUuid())
        && Objects.equals(getEngagementDateStart(), other.getEngagementDateStart())
        && Objects.equals(getEngagementDateEnd(), other.getEngagementDateEnd())
        && Objects.equals(getEngagementDayOfWeek(), other.getEngagementDayOfWeek())
        && Objects.equals(getIncludeEngagementDayOfWeek(), other.getIncludeEngagementDayOfWeek())
        && Objects.equals(getCreatedAtStart(), other.getCreatedAtStart())
        && Objects.equals(getCreatedAtEnd(), other.getCreatedAtEnd())
        && Objects.equals(getUpdatedAtStart(), other.getUpdatedAtStart())
        && Objects.equals(getUpdatedAtEnd(), other.getUpdatedAtEnd())
        && Objects.equals(getReleasedAtStart(), other.getReleasedAtStart())
        && Objects.equals(getReleasedAtEnd(), other.getReleasedAtEnd())
        && Objects.equals(getAttendeeUuid(), other.getAttendeeUuid())
        && Objects.equals(getAtmosphere(), other.getAtmosphere())
        && Objects.equals(getAdvisorOrgUuid(), other.getAdvisorOrgUuid())
        && Objects.equals(getIncludeAdvisorOrgChildren(), other.getIncludeAdvisorOrgChildren())
        && Objects.equals(getPrincipalOrgUuid(), other.getPrincipalOrgUuid())
        && Objects.equals(getIncludePrincipalOrgChildren(), other.getIncludePrincipalOrgChildren())
        && Objects.equals(getOrgUuid(), other.getOrgUuid())
        && Objects.equals(getIncludeOrgChildren(), other.getIncludeOrgChildren())
        && Objects.equals(getLocationUuid(), other.getLocationUuid())
        && Objects.equals(getTaskUuid(), other.getTaskUuid())
        && Objects.equals(getPendingApprovalOf(), other.getPendingApprovalOf())
        && Objects.equals(getState(), other.getState())
        && Objects.equals(getEngagementStatus(), other.getEngagementStatus())
        && Objects.equals(getCancelledReason(), other.getCancelledReason())
        && Objects.equals(getTagUuid(), other.getTagUuid())
        && Objects.equals(getAuthorPositionUuid(), other.getAuthorPositionUuid())
        && Objects.equals(getAttendeePositionUuid(), other.getAttendeePositionUuid())
        && Objects.equals(getAuthorizationGroupUuid(), other.getAuthorizationGroupUuid())
        && Objects.equals(getSensitiveInfo(), other.getSensitiveInfo())
        && Objects.equals(getUser(), other.getUser())
        && Objects.equals(isSystemSearch(), other.isSystemSearch());
  }

  @Override
  public Object clone() throws CloneNotSupportedException {
    final ReportSearchQuery clone = (ReportSearchQuery) super.clone();
    if (state != null) {
      clone.setState(new ArrayList<>(state));
    }
    if (engagementStatus != null) {
      clone.setEngagementStatus(new ArrayList<>(engagementStatus));
    }
    if (authorizationGroupUuid != null) {
      clone.setAuthorizationGroupUuid(new ArrayList<>(authorizationGroupUuid));
    }
    return clone;
  }

}

package mil.dds.anet.beans.search;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import mil.dds.anet.beans.Report.Atmosphere;
import mil.dds.anet.beans.Report.EngagementStatus;
import mil.dds.anet.beans.Report.ReportCancelledReason;
import mil.dds.anet.beans.Report.ReportState;

public class ReportSearchQuery extends SubscribableObjectSearchQuery<ReportSearchSortBy> {

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
  @GraphQLQuery
  @GraphQLInputField
  List<String> orgUuid;
  @GraphQLQuery
  @GraphQLInputField
  private RecurseStrategy orgRecurseStrategy;
  @GraphQLQuery
  @GraphQLInputField
  private List<String> locationUuid;
  @GraphQLQuery
  @GraphQLInputField
  private RecurseStrategy locationRecurseStrategy;
  @GraphQLQuery
  @GraphQLInputField
  List<String> taskUuid;
  @GraphQLQuery
  @GraphQLInputField
  private List<String> notTaskUuid;
  @GraphQLQuery
  @GraphQLInputField
  String pendingApprovalOf;
  @GraphQLQuery
  @GraphQLInputField
  List<ReportState> state;
  @GraphQLQuery
  @GraphQLInputField
  private Boolean includeAllDrafts;
  @GraphQLQuery
  @GraphQLInputField
  List<EngagementStatus> engagementStatus;
  @GraphQLQuery
  @GraphQLInputField
  ReportCancelledReason cancelledReason;
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
  @GraphQLQuery
  @GraphQLInputField
  private String classification;
  @GraphQLQuery
  @GraphQLInputField
  private String eventUuid;
  // internal search parameter:
  @JsonIgnore
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

  public List<String> getOrgUuid() {
    return orgUuid;
  }

  public void setOrgUuid(List<String> orgUuid) {
    this.orgUuid = orgUuid;
  }

  public RecurseStrategy getOrgRecurseStrategy() {
    return orgRecurseStrategy;
  }

  public void setOrgRecurseStrategy(RecurseStrategy orgRecurseStrategy) {
    this.orgRecurseStrategy = orgRecurseStrategy;
  }

  public List<String> getLocationUuid() {
    return locationUuid;
  }

  public void setLocationUuid(List<String> locationUuid) {
    this.locationUuid = locationUuid;
  }

  public RecurseStrategy getLocationRecurseStrategy() {
    return locationRecurseStrategy;
  }

  public void setLocationRecurseStrategy(RecurseStrategy locationRecurseStrategy) {
    this.locationRecurseStrategy = locationRecurseStrategy;
  }

  public List<String> getTaskUuid() {
    return taskUuid;
  }

  public void setTaskUuid(List<String> taskUuid) {
    this.taskUuid = taskUuid;
  }

  public List<String> getNotTaskUuid() {
    return notTaskUuid;
  }

  public void setNotTaskUuid(List<String> notTaskUuid) {
    this.notTaskUuid = notTaskUuid;
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

  public Boolean getIncludeAllDrafts() {
    return includeAllDrafts;
  }

  public void setIncludeAllDrafts(Boolean includeAllDrafts) {
    this.includeAllDrafts = includeAllDrafts;
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

  public void setClassification(String classification) {
    this.classification = classification;
  }

  public String getClassification() {
    return classification;
  }

  public String getEventUuid() {
    return eventUuid;
  }

  public void setEventUuid(String eventUuid) {
    this.eventUuid = eventUuid;
  }

  public boolean isSystemSearch() {
    return systemSearch;
  }

  public void setSystemSearch(boolean systemSearch) {
    this.systemSearch = systemSearch;
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), authorUuid, engagementDateStart, engagementDateEnd,
        engagementDayOfWeek, includeEngagementDayOfWeek, createdAtStart, createdAtEnd,
        updatedAtStart, updatedAtEnd, releasedAtStart, releasedAtEnd, attendeeUuid, atmosphere,
        orgUuid, orgRecurseStrategy, locationUuid, locationRecurseStrategy, taskUuid,
        pendingApprovalOf, state, includeAllDrafts, engagementStatus, cancelledReason,
        authorPositionUuid, attendeePositionUuid, authorizationGroupUuid, sensitiveInfo,
        classification, eventUuid, systemSearch);
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
        && Objects.equals(getOrgUuid(), other.getOrgUuid())
        && Objects.equals(getOrgRecurseStrategy(), other.getOrgRecurseStrategy())
        && Objects.equals(getLocationUuid(), other.getLocationUuid())
        && Objects.equals(getLocationRecurseStrategy(), other.getLocationRecurseStrategy())
        && Objects.equals(getTaskUuid(), other.getTaskUuid())
        && Objects.equals(getNotTaskUuid(), other.getNotTaskUuid())
        && Objects.equals(getPendingApprovalOf(), other.getPendingApprovalOf())
        && Objects.equals(getState(), other.getState())
        && Objects.equals(getIncludeAllDrafts(), other.getIncludeAllDrafts())
        && Objects.equals(getEngagementStatus(), other.getEngagementStatus())
        && Objects.equals(getCancelledReason(), other.getCancelledReason())
        && Objects.equals(getAuthorPositionUuid(), other.getAuthorPositionUuid())
        && Objects.equals(getAttendeePositionUuid(), other.getAttendeePositionUuid())
        && Objects.equals(getAuthorizationGroupUuid(), other.getAuthorizationGroupUuid())
        && Objects.equals(getSensitiveInfo(), other.getSensitiveInfo())
        && Objects.equals(getClassification(), other.getClassification())
        && Objects.equals(getEventUuid(), other.getEventUuid())
        && Objects.equals(isSystemSearch(), other.isSystemSearch());
  }

  @Override
  public ReportSearchQuery clone() throws CloneNotSupportedException {
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
    if (orgUuid != null) {
      clone.setOrgUuid(new ArrayList<>(orgUuid));
    }
    if (locationUuid != null) {
      clone.setLocationUuid(new ArrayList<>(locationUuid));
    }
    if (taskUuid != null) {
      clone.setTaskUuid(new ArrayList<>(taskUuid));
    }
    if (notTaskUuid != null) {
      clone.setTaskUuid(new ArrayList<>(notTaskUuid));
    }
    return clone;
  }
}

package mil.dds.anet.beans.search;

import java.util.List;
import mil.dds.anet.beans.Position.PositionStatus;
import mil.dds.anet.beans.Position.PositionType;

public class PositionSearchQuery extends SubscribableObjectSearchQuery<PositionSearchSortBy> {

  Boolean matchPersonName;
  String organizationUuid;
  Boolean includeChildrenOrgs;
  List<PositionType> type;
  Boolean isFilled;
  String locationUuid;
  PositionStatus status;
  private String authorizationGroupUuid;

  public PositionSearchQuery() {
    super(PositionSearchSortBy.NAME);
    this.matchPersonName = false;
  }

  public Boolean getMatchPersonName() {
    return Boolean.TRUE.equals(matchPersonName);
  }

  public void setMatchPersonName(Boolean matchPersonName) {
    this.matchPersonName = matchPersonName;
  }

  public String getOrganizationUuid() {
    return organizationUuid;
  }

  public void setOrganizationUuid(String orgUuid) {
    this.organizationUuid = orgUuid;
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

  public String getLocationUuid() {
    return locationUuid;
  }

  public void setLocationUuid(String locationUuid) {
    this.locationUuid = locationUuid;
  }

  public PositionStatus getStatus() {
    return status;
  }

  public void setStatus(PositionStatus status) {
    this.status = status;
  }

  public String getAuthorizationGroupUuid() {
    return authorizationGroupUuid;
  }

  public void setAuthorizationGroupUuid(String authorizationGroupUuid) {
    this.authorizationGroupUuid = authorizationGroupUuid;
  }

}

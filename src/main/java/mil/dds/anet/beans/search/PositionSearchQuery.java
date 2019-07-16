package mil.dds.anet.beans.search;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import mil.dds.anet.beans.Position.PositionStatus;
import mil.dds.anet.beans.Position.PositionType;

public class PositionSearchQuery extends AbstractSearchQuery<PositionSearchSortBy> {

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

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), matchPersonName, organizationUuid, includeChildrenOrgs,
        type, isFilled, locationUuid, status, authorizationGroupUuid);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof PositionSearchQuery)) {
      return false;
    }
    final PositionSearchQuery other = (PositionSearchQuery) obj;
    return super.equals(obj) && Objects.equals(getMatchPersonName(), other.getMatchPersonName())
        && Objects.equals(getOrganizationUuid(), other.getOrganizationUuid())
        && Objects.equals(getIncludeChildrenOrgs(), other.getIncludeChildrenOrgs())
        && Objects.equals(getType(), other.getType())
        && Objects.equals(getIsFilled(), other.getIsFilled())
        && Objects.equals(getLocationUuid(), other.getLocationUuid())
        && Objects.equals(getStatus(), other.getStatus())
        && Objects.equals(getAuthorizationGroupUuid(), other.getAuthorizationGroupUuid());
  }

  @Override
  public Object clone() throws CloneNotSupportedException {
    final PositionSearchQuery clone = (PositionSearchQuery) super.clone();
    if (type != null) {
      clone.setType(new ArrayList<>(type));
    }
    return clone;
  }

}

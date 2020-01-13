package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import mil.dds.anet.beans.Position.PositionStatus;
import mil.dds.anet.beans.Position.PositionType;

public class PositionSearchQuery extends AbstractSearchQuery<PositionSearchSortBy> {

  @GraphQLQuery
  @GraphQLInputField
  Boolean matchPersonName;
  @GraphQLQuery
  @GraphQLInputField
  String organizationUuid;
  @GraphQLQuery
  @GraphQLInputField
  Boolean includeChildrenOrgs;
  @GraphQLQuery
  @GraphQLInputField
  List<PositionType> type;
  @GraphQLQuery
  @GraphQLInputField
  Boolean isFilled;
  @GraphQLQuery
  @GraphQLInputField
  String locationUuid;
  @GraphQLQuery
  @GraphQLInputField
  PositionStatus status;
  @GraphQLQuery
  @GraphQLInputField
  private String authorizationGroupUuid;

  public PositionSearchQuery() {
    super(PositionSearchSortBy.NAME);
    this.matchPersonName = false;
  }

  public boolean getMatchPersonName() {
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

  public boolean getIncludeChildrenOrgs() {
    return Boolean.TRUE.equals(includeChildrenOrgs);
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

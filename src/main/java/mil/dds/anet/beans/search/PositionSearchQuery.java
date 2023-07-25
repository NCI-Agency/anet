package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import mil.dds.anet.beans.Position.PositionType;

public class PositionSearchQuery extends SubscribableObjectSearchQuery<PositionSearchSortBy> {

  @GraphQLQuery
  @GraphQLInputField
  Boolean matchPersonName;
  @GraphQLQuery
  @GraphQLInputField
  List<String> organizationUuid;
  @GraphQLQuery
  @GraphQLInputField
  RecurseStrategy orgRecurseStrategy;
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
  private String authorizationGroupUuid;
  @GraphQLQuery
  @GraphQLInputField
  private Boolean hasCounterparts;
  @GraphQLQuery
  @GraphQLInputField
  private Boolean hasPendingAssessments;

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

  public List<String> getOrganizationUuid() {
    return organizationUuid;
  }

  public void setOrganizationUuid(List<String> orgUuid) {
    this.organizationUuid = orgUuid;
  }

  public RecurseStrategy getOrgRecurseStrategy() {
    return orgRecurseStrategy;
  }

  public void setOrgRecurseStrategy(RecurseStrategy orgRecurseStrategy) {
    this.orgRecurseStrategy = orgRecurseStrategy;
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

  public String getAuthorizationGroupUuid() {
    return authorizationGroupUuid;
  }

  public void setAuthorizationGroupUuid(String authorizationGroupUuid) {
    this.authorizationGroupUuid = authorizationGroupUuid;
  }

  public boolean getHasCounterparts() {
    return Boolean.TRUE.equals(hasCounterparts);
  }

  public void setHasCounterparts(Boolean hasCounterparts) {
    this.hasCounterparts = hasCounterparts;
  }

  public boolean getHasPendingAssessments() {
    return Boolean.TRUE.equals(hasPendingAssessments);
  }

  public void setHasPendingAssessments(Boolean hasPendingAssessments) {
    this.hasPendingAssessments = hasPendingAssessments;
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), matchPersonName, organizationUuid, orgRecurseStrategy,
        type, isFilled, locationUuid, authorizationGroupUuid, hasCounterparts,
        hasPendingAssessments);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof PositionSearchQuery)) {
      return false;
    }
    final PositionSearchQuery other = (PositionSearchQuery) obj;
    return super.equals(obj) && Objects.equals(getMatchPersonName(), other.getMatchPersonName())
        && Objects.equals(getOrganizationUuid(), other.getOrganizationUuid())
        && Objects.equals(getOrgRecurseStrategy(), other.getOrgRecurseStrategy())
        && Objects.equals(getType(), other.getType())
        && Objects.equals(getIsFilled(), other.getIsFilled())
        && Objects.equals(getLocationUuid(), other.getLocationUuid())
        && Objects.equals(getAuthorizationGroupUuid(), other.getAuthorizationGroupUuid())
        && Objects.equals(getHasCounterparts(), other.getHasCounterparts())
        && Objects.equals(getHasPendingAssessments(), other.getHasPendingAssessments());
  }

  @Override
  public PositionSearchQuery clone() throws CloneNotSupportedException {
    final PositionSearchQuery clone = (PositionSearchQuery) super.clone();
    if (type != null) {
      clone.setType(new ArrayList<>(type));
    }
    if (organizationUuid != null) {
      clone.setOrganizationUuid(new ArrayList<>(organizationUuid));
    }
    return clone;
  }

}

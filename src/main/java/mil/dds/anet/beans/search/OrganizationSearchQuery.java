package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Objects;

public class OrganizationSearchQuery
    extends SubscribableObjectSearchQuery<OrganizationSearchSortBy> {

  // Find organizations who (don't) have the parentOrg filled in
  @GraphQLQuery
  @GraphQLInputField
  private Boolean hasParentOrg;
  // Search for organizations with a specific parent Org(s).
  @GraphQLQuery
  @GraphQLInputField
  private List<String> parentOrgUuid;
  @GraphQLQuery
  @GraphQLInputField
  private RecurseStrategy orgRecurseStrategy;
  @GraphQLQuery
  @GraphQLInputField
  private List<String> locationUuid;
  @GraphQLQuery
  @GraphQLInputField
  private RecurseStrategy locationRecurseStrategy;
  // Find organizations who (don't) have the profile filled in
  @GraphQLQuery
  @GraphQLInputField
  private Boolean hasProfile;
  @GraphQLQuery
  @GraphQLInputField
  private AssessmentSearchQuery assessment;

  public OrganizationSearchQuery() {
    super(OrganizationSearchSortBy.NAME);
  }

  public Boolean getHasParentOrg() {
    return hasParentOrg;
  }

  public void setHasParentOrg(Boolean hasParentOrg) {
    this.hasParentOrg = hasParentOrg;
  }

  public List<String> getParentOrgUuid() {
    return parentOrgUuid;
  }

  public void setParentOrgUuid(List<String> parentOrgUuid) {
    this.parentOrgUuid = parentOrgUuid;
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

  public Boolean getHasProfile() {
    return hasProfile;
  }

  public void setHasProfile(Boolean hasProfile) {
    this.hasProfile = hasProfile;
  }

  public AssessmentSearchQuery getAssessment() {
    return assessment;
  }

  public void setAssessment(AssessmentSearchQuery assessment) {
    this.assessment = assessment;
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), hasParentOrg, parentOrgUuid, orgRecurseStrategy,
        locationUuid, locationRecurseStrategy, hasProfile, assessment);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof OrganizationSearchQuery)) {
      return false;
    }
    final OrganizationSearchQuery other = (OrganizationSearchQuery) obj;
    return super.equals(obj) && Objects.equals(getHasParentOrg(), other.getHasParentOrg())
        && Objects.equals(getParentOrgUuid(), other.getParentOrgUuid())
        && Objects.equals(getOrgRecurseStrategy(), other.getOrgRecurseStrategy())
        && Objects.equals(getLocationUuid(), other.getLocationUuid())
        && Objects.equals(getLocationRecurseStrategy(), other.getLocationRecurseStrategy())
        && Objects.equals(getHasProfile(), other.getHasProfile())
        && Objects.equals(getAssessment(), other.getAssessment());
  }

  @Override
  public OrganizationSearchQuery clone() throws CloneNotSupportedException {
    final OrganizationSearchQuery clone = (OrganizationSearchQuery) super.clone();
    if (parentOrgUuid != null) {
      clone.setParentOrgUuid(new ArrayList<>(parentOrgUuid));
    }
    if (locationUuid != null) {
      clone.setLocationUuid(new ArrayList<>(locationUuid));
    }
    if (assessment != null) {
      clone.setAssessment(
          new AssessmentSearchQuery(assessment.key(), new HashMap<>(assessment.filters())));
    }
    return clone;
  }

}

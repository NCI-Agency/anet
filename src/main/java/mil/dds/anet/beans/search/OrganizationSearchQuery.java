package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.ArrayList;
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
  //
  @GraphQLQuery
  @GraphQLInputField
  String locationUuid;
  @GraphQLQuery
  @GraphQLInputField
  private RecurseStrategy orgRecurseStrategy;
  // Find organizations who (don't) have the profile filled in
  @GraphQLQuery
  @GraphQLInputField
  private Boolean hasProfile;

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

  public String getLocationUuid() {
    return locationUuid;
  }

  public void setLocationUuid(String locationUuid) {
    this.locationUuid = locationUuid;
  }


  public RecurseStrategy getOrgRecurseStrategy() {
    return orgRecurseStrategy;
  }

  public void setOrgRecurseStrategy(RecurseStrategy orgRecurseStrategy) {
    this.orgRecurseStrategy = orgRecurseStrategy;
  }

  public Boolean getHasProfile() {
    return hasProfile;
  }

  public void setHasProfile(Boolean hasProfile) {
    this.hasProfile = hasProfile;
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), hasParentOrg, parentOrgUuid, locationUuid,
        orgRecurseStrategy);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof OrganizationSearchQuery)) {
      return false;
    }
    final OrganizationSearchQuery other = (OrganizationSearchQuery) obj;
    return super.equals(obj) && Objects.equals(getHasParentOrg(), other.getHasParentOrg())
        && Objects.equals(getParentOrgUuid(), other.getParentOrgUuid())
        && Objects.equals(getHasProfile(), other.getHasProfile())
        && Objects.equals(getOrgRecurseStrategy(), other.getOrgRecurseStrategy());
  }

  @Override
  public OrganizationSearchQuery clone() throws CloneNotSupportedException {
    final OrganizationSearchQuery clone = (OrganizationSearchQuery) super.clone();
    if (parentOrgUuid != null) {
      clone.setParentOrgUuid(new ArrayList<>(parentOrgUuid));
    }
    return clone;
  }

}

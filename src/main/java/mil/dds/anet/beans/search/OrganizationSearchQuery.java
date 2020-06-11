package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.List;
import java.util.Objects;
import mil.dds.anet.beans.Organization.OrganizationStatus;
import mil.dds.anet.beans.Organization.OrganizationType;

public class OrganizationSearchQuery extends AbstractSearchQuery<OrganizationSearchSortBy> {

  @GraphQLQuery
  @GraphQLInputField
  private OrganizationStatus status;
  @GraphQLQuery
  @GraphQLInputField
  private OrganizationType type;
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

  public OrganizationSearchQuery() {
    super(OrganizationSearchSortBy.NAME);
  }

  public OrganizationStatus getStatus() {
    return status;
  }

  public void setStatus(OrganizationStatus status) {
    this.status = status;
  }

  public OrganizationType getType() {
    return type;
  }

  public void setType(OrganizationType type) {
    this.type = type;
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

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), status, type, hasParentOrg, parentOrgUuid,
        orgRecurseStrategy);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof OrganizationSearchQuery)) {
      return false;
    }
    final OrganizationSearchQuery other = (OrganizationSearchQuery) obj;
    return super.equals(obj) && Objects.equals(getStatus(), other.getStatus())
        && Objects.equals(getType(), other.getType())
        && Objects.equals(getHasParentOrg(), other.getHasParentOrg())
        && Objects.equals(getParentOrgUuid(), other.getParentOrgUuid())
        && Objects.equals(getOrgRecurseStrategy(), other.getOrgRecurseStrategy());
  }

}

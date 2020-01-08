package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
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

  // Search for organizations with a specific parent Org.
  @GraphQLQuery
  @GraphQLInputField
  private String parentOrgUuid;
  // Include descendants recursively from the specified parent.
  // If true will include all orgs in the tree of the parentOrg
  // Including the parent Org.
  @GraphQLQuery
  @GraphQLInputField
  private Boolean parentOrgRecursively;

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

  public String getParentOrgUuid() {
    return parentOrgUuid;
  }

  public void setParentOrgUuid(String parentOrgUuid) {
    this.parentOrgUuid = parentOrgUuid;
  }

  public boolean getParentOrgRecursively() {
    return Boolean.TRUE.equals(parentOrgRecursively);
  }

  public void setParentOrgRecursively(Boolean parentOrgRecursively) {
    this.parentOrgRecursively = parentOrgRecursively;
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), status, type, parentOrgUuid, parentOrgRecursively);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof OrganizationSearchQuery)) {
      return false;
    }
    final OrganizationSearchQuery other = (OrganizationSearchQuery) obj;
    return super.equals(obj) && Objects.equals(getStatus(), other.getStatus())
        && Objects.equals(getType(), other.getType())
        && Objects.equals(getParentOrgUuid(), other.getParentOrgUuid())
        && Objects.equals(getParentOrgRecursively(), other.getParentOrgRecursively());
  }

}

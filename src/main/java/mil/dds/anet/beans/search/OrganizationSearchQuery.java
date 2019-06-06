package mil.dds.anet.beans.search;

import mil.dds.anet.beans.Organization.OrganizationStatus;
import mil.dds.anet.beans.Organization.OrganizationType;

public class OrganizationSearchQuery extends SubscribableObjectSearchQuery<OrganizationSearchSortBy> {

  private OrganizationStatus status;
  private OrganizationType type;

  // Search for organizations with a specific parent Org.
  private String parentOrgUuid;
  // Include descendants recursively from the specified parent.
  // If true will include all orgs in the tree of the parentOrg
  // Including the parent Org.
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

  public Boolean getParentOrgRecursively() {
    return parentOrgRecursively;
  }

  public void setParentOrgRecursively(Boolean parentOrgRecursively) {
    this.parentOrgRecursively = parentOrgRecursively;
  }

}

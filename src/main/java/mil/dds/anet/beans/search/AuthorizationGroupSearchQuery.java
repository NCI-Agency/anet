package mil.dds.anet.beans.search;

import mil.dds.anet.beans.AuthorizationGroup.AuthorizationGroupStatus;

public class AuthorizationGroupSearchQuery extends AbstractSearchQuery {

  public enum AuthorizationGroupSearchSortBy {
    CREATED_AT, NAME
  }

  private AuthorizationGroupStatus status;
  private String positionUuid;
  private AuthorizationGroupSearchSortBy sortBy;

  public AuthorizationGroupStatus getStatus() {
    return status;
  }

  public void setStatus(AuthorizationGroupStatus status) {
    this.status = status;
  }

  public String getPositionUuid() {
    return positionUuid;
  }

  public void setPositionUuid(String positionUuid) {
    this.positionUuid = positionUuid;
  }

  public AuthorizationGroupSearchSortBy getSortBy() {
    return sortBy;
  }

  public void setSortBy(AuthorizationGroupSearchSortBy sortBy) {
    this.sortBy = sortBy;
  }

}

package mil.dds.anet.beans.search;

import mil.dds.anet.beans.AuthorizationGroup.AuthorizationGroupStatus;

public class AuthorizationGroupSearchQuery extends AbstractSearchQuery {

  public enum AuthorizationGroupSearchSortBy {
    CREATED_AT, NAME
  }

  private AuthorizationGroupStatus status;
  private String positionUuid;
  private AuthorizationGroupSearchSortBy sortBy;
  private SortOrder sortOrder;

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

  public SortOrder getSortOrder() {
    return sortOrder;
  }

  public void setSortOrder(SortOrder sortOrder) {
    this.sortOrder = sortOrder;
  }

  public static AuthorizationGroupSearchQuery withText(String text, int pageNum, int pageSize) {
    final AuthorizationGroupSearchQuery query = new AuthorizationGroupSearchQuery();
    query.setText(text);
    query.setPageNum(pageNum);
    query.setPageSize(pageSize);
    return query;
  }

}

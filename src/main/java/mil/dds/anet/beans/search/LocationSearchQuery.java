package mil.dds.anet.beans.search;

import mil.dds.anet.beans.Location.LocationStatus;

public class LocationSearchQuery extends AbstractSearchQuery {

  public enum LocationSearchSortBy {
    CREATED_AT, NAME
  }

  private LocationStatus status;

  private LocationSearchSortBy sortBy;

  public LocationStatus getStatus() {
    return status;
  }

  public void setStatus(LocationStatus status) {
    this.status = status;
  }

  public LocationSearchSortBy getSortBy() {
    return sortBy;
  }

  public void setSortBy(LocationSearchSortBy sortBy) {
    this.sortBy = sortBy;
  }

  public static LocationSearchQuery withText(String text, int pageNum, int pageSize) {
    LocationSearchQuery query = new LocationSearchQuery();
    query.setText(text);
    query.setPageNum(pageNum);
    query.setPageSize(pageSize);
    return query;
  }

}

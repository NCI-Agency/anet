package mil.dds.anet.beans.search;

import mil.dds.anet.beans.Location.LocationStatus;

public class LocationSearchQuery extends SubscribableObjectSearchQuery<LocationSearchSortBy> {

  private LocationStatus status;

  public LocationSearchQuery() {
    super(LocationSearchSortBy.NAME);
  }

  public LocationStatus getStatus() {
    return status;
  }

  public void setStatus(LocationStatus status) {
    this.status = status;
  }

}

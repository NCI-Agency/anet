package mil.dds.anet.beans.search;

public class LocationSearchQuery extends AbstractSearchQuery<LocationSearchSortBy> {

  public LocationSearchQuery() {
    super(LocationSearchSortBy.NAME);
  }
}

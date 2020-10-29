package mil.dds.anet.beans.search;

public class LocationSearchQuery extends SubscribableObjectSearchQuery<LocationSearchSortBy> {

  public LocationSearchQuery() {
    super(LocationSearchSortBy.NAME);
  }

  @Override
  public LocationSearchQuery clone() throws CloneNotSupportedException {
    return (LocationSearchQuery) super.clone();
  }

}

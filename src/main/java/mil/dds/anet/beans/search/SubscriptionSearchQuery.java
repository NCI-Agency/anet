package mil.dds.anet.beans.search;

public class SubscriptionSearchQuery extends AbstractSearchQuery<SubscriptionSearchSortBy> {

  public SubscriptionSearchQuery() {
    super(SubscriptionSearchSortBy.CREATED_AT);
    this.setSortOrder(SortOrder.DESC);
  }

  @Override
  public SubscriptionSearchQuery clone() throws CloneNotSupportedException {
    return (SubscriptionSearchQuery) super.clone();
  }

}

package mil.dds.anet.beans.search;

public class SubscriptionSearchQuery extends AbstractSearchQuery<SubscriptionSearchSortBy> {

  public SubscriptionSearchQuery() {
    super(SubscriptionSearchSortBy.CREATED_AT);
    this.setSortOrder(SortOrder.DESC);
  }

}

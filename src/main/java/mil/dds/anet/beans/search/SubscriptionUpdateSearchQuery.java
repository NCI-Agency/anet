package mil.dds.anet.beans.search;

public class SubscriptionUpdateSearchQuery
    extends AbstractSearchQuery<SubscriptionUpdateSearchSortBy> {

  public SubscriptionUpdateSearchQuery() {
    super(SubscriptionUpdateSearchSortBy.CREATED_AT);
    this.setSortOrder(SortOrder.DESC);
  }

  @Override
  public SubscriptionUpdateSearchQuery clone() throws CloneNotSupportedException {
    return (SubscriptionUpdateSearchQuery) super.clone();
  }

}

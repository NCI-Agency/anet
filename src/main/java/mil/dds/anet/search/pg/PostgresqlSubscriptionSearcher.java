package mil.dds.anet.search.pg;

import mil.dds.anet.beans.Subscription;
import mil.dds.anet.beans.search.SubscriptionSearchQuery;
import mil.dds.anet.search.AbstractSubscriptionSearcher;

public class PostgresqlSubscriptionSearcher extends AbstractSubscriptionSearcher {

  public PostgresqlSubscriptionSearcher() {
    super(new PostgresqlSearchQueryBuilder<Subscription, SubscriptionSearchQuery>(
        "PostgresqlSubscriptionSearch"));
  }

}

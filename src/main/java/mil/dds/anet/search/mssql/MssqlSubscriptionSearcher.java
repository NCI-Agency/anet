package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.Subscription;
import mil.dds.anet.beans.search.SubscriptionSearchQuery;
import mil.dds.anet.search.AbstractSubscriptionSearcher;

public class MssqlSubscriptionSearcher extends AbstractSubscriptionSearcher {

  public MssqlSubscriptionSearcher() {
    super(new MssqlSearchQueryBuilder<Subscription, SubscriptionSearchQuery>(
        "MssqlSubscriptionSearch"));
  }

}

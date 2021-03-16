package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.SubscriptionUpdate;
import mil.dds.anet.beans.search.SubscriptionUpdateSearchQuery;
import mil.dds.anet.search.AbstractSubscriptionUpdateSearcher;

public class MssqlSubscriptionUpdateSearcher extends AbstractSubscriptionUpdateSearcher {

  public MssqlSubscriptionUpdateSearcher() {
    super(new MssqlSearchQueryBuilder<SubscriptionUpdate, SubscriptionUpdateSearchQuery>(
        "MssqlSubscriptionUpdateSearch"));
  }

}

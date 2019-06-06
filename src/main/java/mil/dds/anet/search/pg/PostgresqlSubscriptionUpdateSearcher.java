package mil.dds.anet.search.pg;

import mil.dds.anet.beans.SubscriptionUpdate;
import mil.dds.anet.beans.search.SubscriptionUpdateSearchQuery;
import mil.dds.anet.search.AbstractSubscriptionUpdateSearcher;

public class PostgresqlSubscriptionUpdateSearcher extends AbstractSubscriptionUpdateSearcher {

  public PostgresqlSubscriptionUpdateSearcher() {
    super(new PostgresqlSearchQueryBuilder<SubscriptionUpdate, SubscriptionUpdateSearchQuery>(
        "PostgresqlSubscriptionUpdateSearch"));
  }

}

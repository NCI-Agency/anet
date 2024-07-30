package mil.dds.anet.search.pg;

import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.search.AbstractSubscriptionUpdateSearcher;
import org.springframework.stereotype.Component;

@Component
public class PostgresqlSubscriptionUpdateSearcher extends AbstractSubscriptionUpdateSearcher {

  public PostgresqlSubscriptionUpdateSearcher(DatabaseHandler databaseHandler) {
    super(databaseHandler,
        new PostgresqlSearchQueryBuilder<>("PostgresqlSubscriptionUpdateSearch"));
  }

}

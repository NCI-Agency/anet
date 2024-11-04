package mil.dds.anet.search.pg;

import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.search.AbstractSubscriptionSearcher;
import org.springframework.stereotype.Component;

@Component
public class PostgresqlSubscriptionSearcher extends AbstractSubscriptionSearcher {

  public PostgresqlSubscriptionSearcher(DatabaseHandler databaseHandler) {
    super(databaseHandler, new PostgresqlSearchQueryBuilder<>("PostgresqlSubscriptionSearch"));
  }

}

package mil.dds.anet.database;

import mil.dds.anet.beans.SubscriptionUpdate;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.SubscriptionUpdateSearchQuery;
import mil.dds.anet.search.pg.PostgresqlSubscriptionUpdateSearcher;
import mil.dds.anet.utils.DaoUtils;
import org.springframework.stereotype.Component;

@Component
public class SubscriptionUpdateDao {

  private static final String[] fields = {"subscriptionUuid", "updatedObjectType",
      "updatedObjectUuid", "isNote", "createdAt", "auditTrailUuid"};
  public static final String TABLE_NAME = "subscriptionUpdates";
  public static final String SUBSCRIPTION_UPDATE_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  private final DatabaseHandler databaseHandler;

  public SubscriptionUpdateDao(DatabaseHandler databaseHandler) {
    this.databaseHandler = databaseHandler;
  }

  public AnetBeanList<SubscriptionUpdate> search(SubscriptionUpdateSearchQuery query) {
    return new PostgresqlSubscriptionUpdateSearcher(databaseHandler).runSearch(query);
  }

}

package mil.dds.anet.database;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.SubscriptionUpdate;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.SubscriptionUpdateSearchQuery;
import mil.dds.anet.utils.DaoUtils;

public class SubscriptionUpdateDao {

  private static final String[] fields =
      {"subscriptionUuid", "updatedObjectType", "updatedObjectUuid", "isNote", "createdAt"};
  public static final String TABLE_NAME = "subscriptionUpdates";
  public static final String SUBSCRIPTION_UPDATE_FIELDS =
      DaoUtils.buildFieldAliases(TABLE_NAME, fields, true);

  public AnetBeanList<SubscriptionUpdate> search(Person user, SubscriptionUpdateSearchQuery query) {
    return AnetObjectEngine.getInstance().getSearcher().getSubscriptionUpdateSearcher()
        .runSearch(query, user);
  }

}

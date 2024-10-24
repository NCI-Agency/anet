package mil.dds.anet.search;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Subscription;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.SubscriptionSearchQuery;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.database.SubscriptionDao;
import mil.dds.anet.database.mappers.SubscriptionMapper;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.springframework.transaction.annotation.Transactional;

public abstract class AbstractSubscriptionSearcher extends
    AbstractSearcher<Subscription, SubscriptionSearchQuery> implements ISubscriptionSearcher {

  protected AbstractSubscriptionSearcher(DatabaseHandler databaseHandler,
      AbstractSearchQueryBuilder<Subscription, SubscriptionSearchQuery> qb) {
    super(databaseHandler, qb);
  }

  @Transactional
  @Override
  public AnetBeanList<Subscription> runSearch(SubscriptionSearchQuery query, Person user) {
    final Handle handle = getDbHandle();
    try {
      buildQuery(query, user);
      return qb.buildAndRun(handle, query, new SubscriptionMapper());
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  protected void buildQuery(SubscriptionSearchQuery query) {
    throw new UnsupportedOperationException();
  }

  protected void buildQuery(SubscriptionSearchQuery query, Person user) {
    qb.addSelectClause(SubscriptionDao.SUBSCRIPTION_FIELDS);
    qb.addFromClause("subscriptions");
    final Position position = DaoUtils.getPosition(user);
    qb.addStringEqualsClause("positionUuid", "subscriptions.\"subscriberUuid\"",
        DaoUtils.getUuid(position));
    addOrderByClauses(qb, query);
  }

  @Override
  protected void addTextQuery(SubscriptionSearchQuery query) {
    throw new UnsupportedOperationException();
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      SubscriptionSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "subscriptions_createdAt"));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "subscriptions_subscribedObjectType",
        "subscriptions_subscribedObjectUuid"));
  }

}

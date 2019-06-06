package mil.dds.anet.search;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.Subscription;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.SubscriptionSearchQuery;
import mil.dds.anet.database.mappers.SubscriptionMapper;
import mil.dds.anet.utils.DaoUtils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public abstract class AbstractSubscriptionSearcher extends
    AbstractSearcher<Subscription, SubscriptionSearchQuery> implements ISubscriptionSearcher {

  public AbstractSubscriptionSearcher(
      AbstractSearchQueryBuilder<Subscription, SubscriptionSearchQuery> qb) {
    super(qb);
  }

  @InTransaction
  @Override
  public AnetBeanList<Subscription> runSearch(SubscriptionSearchQuery query, Person user) {
    buildQuery(query, user);
    return qb.buildAndRun(getDbHandle(), query, new SubscriptionMapper());
  }

  @Override
  protected void buildQuery(SubscriptionSearchQuery query) {
    throw new UnsupportedOperationException();
  }

  protected void buildQuery(SubscriptionSearchQuery query, Person user) {
    qb.addSelectClause("subscriptions.*");
    qb.addTotalCount();
    qb.addFromClause("subscriptions");
    final Position position = user.loadPosition();
    qb.addEqualsClause("positionUuid", "\"subscriptions\".\"subscriberUuid\"",
        DaoUtils.getUuid(position));
    addOrderByClauses(qb, query);
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      SubscriptionSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "subscriptions", "\"createdAt\""));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "subscriptions.\"subscribedObjectType\"",
        "subscriptions.\"subscribedObjectUuid\""));
  }

}

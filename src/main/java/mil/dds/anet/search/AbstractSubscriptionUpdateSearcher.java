package mil.dds.anet.search;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.SubscriptionUpdate;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.SubscriptionUpdateSearchQuery;
import mil.dds.anet.database.mappers.SubscriptionUpdateMapper;
import mil.dds.anet.utils.DaoUtils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public abstract class AbstractSubscriptionUpdateSearcher
    extends AbstractSearcher<SubscriptionUpdate, SubscriptionUpdateSearchQuery>
    implements ISubscriptionUpdateSearcher {

  public AbstractSubscriptionUpdateSearcher(
      AbstractSearchQueryBuilder<SubscriptionUpdate, SubscriptionUpdateSearchQuery> qb) {
    super(qb);
  }

  @InTransaction
  @Override
  public AnetBeanList<SubscriptionUpdate> runSearch(SubscriptionUpdateSearchQuery query,
      Person user) {
    buildQuery(query, user);
    return qb.buildAndRun(getDbHandle(), query, new SubscriptionUpdateMapper());
  }

  @Override
  protected void buildQuery(SubscriptionUpdateSearchQuery query) {
    throw new UnsupportedOperationException();
  }

  protected void buildQuery(SubscriptionUpdateSearchQuery query, Person user) {
    qb.addSelectClause("\"subscriptionUpdates\".*");
    qb.addTotalCount();
    qb.addFromClause("\"subscriptionUpdates\"");
    final Position position = user.loadPosition();
    qb.addWhereClause(
        "\"subscriptionUpdates\".\"subscriptionUuid\" IN ( SELECT uuid FROM subscriptions "
            + "  WHERE subscriptions.\"subscriberUuid\" = :positionUuid )");
    qb.addSqlArg("positionUuid", DaoUtils.getUuid(position));
    addOrderByClauses(qb, query);
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      SubscriptionUpdateSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
      default:
        qb.addAllOrderByClauses(
            getOrderBy(query.getSortOrder(), "\"subscriptionUpdates\"", "\"createdAt\""));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "\"subscriptionUpdates\"",
        "\"updatedObjectType\"", "\"updatedObjectUuid\""));
  }

}

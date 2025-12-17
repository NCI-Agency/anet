package mil.dds.anet.search;

import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.SubscriptionUpdate;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.SubscriptionUpdateSearchQuery;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.database.SubscriptionUpdateDao;
import mil.dds.anet.database.mappers.SubscriptionUpdateMapper;
import mil.dds.anet.utils.DaoUtils;
import org.jdbi.v3.core.Handle;
import org.springframework.transaction.annotation.Transactional;

public abstract class AbstractSubscriptionUpdateSearcher
    extends AbstractSearcher<SubscriptionUpdate, SubscriptionUpdateSearchQuery>
    implements ISubscriptionUpdateSearcher {

  protected AbstractSubscriptionUpdateSearcher(DatabaseHandler databaseHandler,
      AbstractSearchQueryBuilder<SubscriptionUpdate, SubscriptionUpdateSearchQuery> qb) {
    super(databaseHandler, qb);
  }

  @Transactional
  @Override
  public AnetBeanList<SubscriptionUpdate> runSearch(SubscriptionUpdateSearchQuery query) {
    final Handle handle = getDbHandle();
    try {
      buildQuery(query);
      return qb.buildAndRun(handle, query, new SubscriptionUpdateMapper());
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  protected void buildQuery(SubscriptionUpdateSearchQuery query) {
    qb.addSelectClause(SubscriptionUpdateDao.SUBSCRIPTION_UPDATE_FIELDS);
    qb.addFromClause("\"subscriptionUpdates\"");
    final Position position = DaoUtils.getPosition(query.getUser());
    qb.addWhereClause(
        "\"subscriptionUpdates\".\"subscriptionUuid\" IN ( SELECT uuid FROM subscriptions "
            + "  WHERE subscriptions.\"subscriberUuid\" = :positionUuid )");
    qb.addSqlArg("positionUuid", DaoUtils.getUuid(position));
    addOrderByClauses(qb, query);
  }

  @Override
  protected void addTextQuery(SubscriptionUpdateSearchQuery query) {
    throw new UnsupportedOperationException();
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      SubscriptionUpdateSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "subscriptionUpdates_createdAt"));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "subscriptionUpdates_updatedObjectType",
        "subscriptionUpdates_updatedObjectUuid"));
  }

}

package mil.dds.anet.search;

import mil.dds.anet.beans.UserActivity;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.UserActivitySearchQuery;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.database.mappers.UserActivityMapper;
import org.jdbi.v3.core.Handle;
import org.springframework.transaction.annotation.Transactional;

public abstract class AbstractUserActivitySearcher extends
    AbstractSearcher<UserActivity, UserActivitySearchQuery> implements IUserActivitySearcher {

  protected static final String WITH_CLAUSE_NAME = "ua";

  protected AbstractUserActivitySearcher(DatabaseHandler databaseHandler,
      AbstractSearchQueryBuilder<UserActivity, UserActivitySearchQuery> qb) {
    super(databaseHandler, qb);
  }

  @Transactional
  @Override
  public AnetBeanList<UserActivity> runSearch(final UserActivitySearchQuery query) {
    final Handle handle = getDbHandle();
    try {
      buildQuery(query);
      return qb.buildAndRun(handle, query, new UserActivityMapper());
    } finally {
      closeDbHandle(handle);
    }
  }

  @Override
  protected void buildQuery(final UserActivitySearchQuery query) {
    final String column = getColumn(query, false);
    switch (query.getAggregationType()) {
      case BY_OBJECT:
        qb.addSelectClause(column);
        break;
      case OVER_TIME:
        qb.addSelectClause(column + " AS \"aggregatedDate\"");
        break;
    }
    qb.addSelectClause("count");
    qb.addFromClause(WITH_CLAUSE_NAME);
    addOrderByClauses(qb, query);
  }

  @Override
  protected void addTextQuery(final UserActivitySearchQuery query) {
    throw new UnsupportedOperationException();
  }

  protected void addOrderByClauses(final AbstractSearchQueryBuilder<?, ?> qb,
      final UserActivitySearchQuery query) {
    switch (query.getSortBy()) {
      case NONE:
        break;
      case COUNT:
      default:
        qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "count"));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, getColumn(query, true)));
  }

  private String getColumn(final UserActivitySearchQuery query, boolean forOrderBy) {
    String column = null;
    switch (query.getAggregationType()) {
      case BY_OBJECT:
        switch (query.getSearchType()) {
          case PERSON:
            column = "personUuid";
            break;
          case ORGANIZATION:
          case TOP_LEVEL_ORGANIZATION:
            column = "organizationUuid";
            break;
        }
        break;
      case OVER_TIME:
        column = forOrderBy ? "aggregatedDate" : "period";
        break;
    }
    if (!forOrderBy) {
      // Order By quotes the column itself
      column = String.format("\"%1$s\"", column);
    }
    return column;
  }
}

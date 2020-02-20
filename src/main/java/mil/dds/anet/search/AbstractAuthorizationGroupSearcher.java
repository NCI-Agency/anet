package mil.dds.anet.search;

import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.database.mappers.AuthorizationGroupMapper;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public abstract class AbstractAuthorizationGroupSearcher
    extends AbstractSearcher<AuthorizationGroup, AuthorizationGroupSearchQuery>
    implements IAuthorizationGroupSearcher {

  public AbstractAuthorizationGroupSearcher(
      AbstractSearchQueryBuilder<AuthorizationGroup, AuthorizationGroupSearchQuery> qb) {
    super(qb);
  }

  @InTransaction
  @Override
  public AnetBeanList<AuthorizationGroup> runSearch(AuthorizationGroupSearchQuery query) {
    buildQuery(query);
    return qb.buildAndRun(getDbHandle(), query, new AuthorizationGroupMapper());
  }

  @Override
  protected void buildQuery(AuthorizationGroupSearchQuery query) {
    qb.addSelectClause("\"authorizationGroups\".*");
    qb.addTotalCount();
    qb.addFromClause("\"authorizationGroups\"");

    if (query.isTextPresent()) {
      addTextQuery(query);
    }

    qb.addEqualsClause("status", "\"authorizationGroups\".status", query.getStatus());

    if (query.getPositionUuid() != null) {
      // Search for authorization groups related to a given position
      qb.addWhereClause(
          "\"authorizationGroups\".uuid IN (SELECT ap.\"authorizationGroupUuid\" FROM \"authorizationGroupPositions\" ap"
              + " WHERE ap.\"positionUuid\" = :positionUuid)");
      qb.addSqlArg("positionUuid", query.getPositionUuid());
    }

    addOrderByClauses(qb, query);
  }

  protected abstract void addTextQuery(AuthorizationGroupSearchQuery query);

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      AuthorizationGroupSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(
            getOrderBy(query.getSortOrder(), "\"authorizationGroups\"", "\"createdAt\""));
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(
            getOrderBy(query.getSortOrder(), "\"authorizationGroups\"", "name"));
        break;
    }
    qb.addAllOrderByClauses(getOrderBy(SortOrder.ASC, "\"authorizationGroups\"", "uuid"));
  }

}

package mil.dds.anet.search;

import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.database.mappers.AuthorizationGroupMapper;
import mil.dds.anet.utils.DaoUtils;
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

    if (Boolean.TRUE.equals(query.isInMyReports())) {
      qb.addFromClause("JOIN ("
          + "  SELECT \"reportAuthorizationGroups\".\"authorizationGroupUuid\" AS uuid, MAX(reports.\"createdAt\") AS max"
          + "  FROM reports"
          + "  JOIN \"reportAuthorizationGroups\" ON reports.uuid = \"reportAuthorizationGroups\".\"reportUuid\""
          + "  WHERE reports.\"authorUuid\" = :userUuid"
          + "  GROUP BY \"reportAuthorizationGroups\".\"authorizationGroupUuid\""
          + ") \"inMyReports\" ON \"authorizationGroups\".uuid = \"inMyReports\".uuid");
      qb.addSqlArg("userUuid", DaoUtils.getUuid(query.getUser()));
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
      case RECENT:
        if (Boolean.TRUE.equals(query.isInMyReports())) {
          // Otherwise the JOIN won't exist
          qb.addAllOrderByClauses(getOrderBy(query.getSortOrder(), "\"inMyReports\"", "max"));
        }
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

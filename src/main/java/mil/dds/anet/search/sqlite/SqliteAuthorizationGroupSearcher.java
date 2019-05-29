package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.database.mappers.AuthorizationGroupMapper;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.search.AbstractSearcher;
import mil.dds.anet.search.IAuthorizationGroupSearcher;
import mil.dds.anet.search.mssql.MssqlSearchQueryBuilder;
import mil.dds.anet.utils.Utils;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

public class SqliteAuthorizationGroupSearcher extends AbstractSearcher
    implements IAuthorizationGroupSearcher {

  @InTransaction
  @Override
  public AnetBeanList<AuthorizationGroup> runSearch(AuthorizationGroupSearchQuery query) {
    final MssqlSearchQueryBuilder<AuthorizationGroup, AuthorizationGroupSearchQuery> qb =
        new MssqlSearchQueryBuilder<AuthorizationGroup, AuthorizationGroupSearchQuery>(
            "SqliteAuthorizationGroupSearch");
    qb.addSelectClause("*");
    qb.addFromClause("\"authorizationGroups\"");

    if (query.isTextPresent()) {
      qb.addWhereClause("(name LIKE '%' || :text || '%' OR description LIKE '%' || :text || '%')");
      final String text = query.getText();
      qb.addSqlArg("text", Utils.getSqliteFullTextQuery(text));
    }

    qb.addEqualsClause("status", "status", query.getStatus());

    if (query.getPositionUuid() != null) {
      // Search for authorization groups related to a given position
      qb.addWhereClause(
          "uuid IN (SELECT \"authorizationGroupUuid\" FROM \"authorizationGroupPositions\""
              + " WHERE \"positionUuid\" = :positionUuid)");
      qb.addSqlArg("positionUuid", query.getPositionUuid());
    }

    addOrderByClauses(qb, query);
    return qb.buildAndRun(getDbHandle(), query, new AuthorizationGroupMapper());
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      AuthorizationGroupSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), null, "\"createdAt\""));
        break;
      case NAME:
      default:
        qb.addAllOrderByClauses(Utils.addOrderBy(query.getSortOrder(), null, "name"));
        break;
    }
    qb.addAllOrderByClauses(Utils.addOrderBy(SortOrder.ASC, null, "uuid"));
  }

}

package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.database.mappers.AuthorizationGroupMapper;
import mil.dds.anet.search.IAuthorizationGroupSearcher;
import mil.dds.anet.utils.Utils;

public class SqliteAuthorizationGroupSearcher
    extends AbstractSqliteSearcherBase<AuthorizationGroup, AuthorizationGroupSearchQuery>
    implements IAuthorizationGroupSearcher {

  @Override
  public AnetBeanList<AuthorizationGroup> runSearch(AuthorizationGroupSearchQuery query) {
    start("SqliteAuthorizationGroupSearch");
    sql.append("SELECT * FROM \"authorizationGroups\"");

    if (query.isTextPresent()) {
      final String text = query.getText();
      whereClauses.add("(name LIKE '%' || :text || '%' OR description LIKE '%' || :text || '%' )");
      sqlArgs.put("text", Utils.getSqliteFullTextQuery(text));
    }

    addEqualsClause("status", "status", query.getStatus());

    if (query.getPositionUuid() != null) {
      // Search for authorization groups related to a given position
      whereClauses
          .add("uuid IN ( SELECT \"authorizationGroupUuid\" FROM \"authorizationGroupPositions\" "
              + "WHERE \"positionUuid\" = :positionUuid )");
      sqlArgs.put("positionUuid", query.getPositionUuid());
    }

    finish(query);
    return getResult(query, new AuthorizationGroupMapper());
  }

  @Override
  protected void getOrderByClauses(AuthorizationGroupSearchQuery query) {
    switch (query.getSortBy()) {
      case CREATED_AT:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), null, "\"createdAt\""));
        break;
      case NAME:
      default:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), null, "name"));
        break;
    }
    orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, null, "uuid"));
  }

}

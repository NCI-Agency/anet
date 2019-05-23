package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.database.mappers.AuthorizationGroupMapper;
import mil.dds.anet.search.IAuthorizationGroupSearcher;
import mil.dds.anet.utils.Utils;

public class MssqlAuthorizationGroupSearcher
    extends AbstractMssqlSearcherBase<AuthorizationGroup, AuthorizationGroupSearchQuery>
    implements IAuthorizationGroupSearcher {

  @Override
  public AnetBeanList<AuthorizationGroup> runSearch(AuthorizationGroupSearchQuery query) {
    start("MssqlAuthorizationGroupSearch");
    sql.append("SELECT authorizationGroups.*");

    final boolean doFullTextSearch = query.isTextPresent();
    if (doFullTextSearch) {
      // If we're doing a full-text search, add a pseudo-rank (the sum of all search ranks)
      // so we can sort on it (show the most relevant hits at the top).
      // Note that summing up independent ranks is not ideal, but it's the best we can do now.
      // See
      // https://docs.microsoft.com/en-us/sql/relational-databases/search/limit-search-results-with-rank
      sql.append(", ISNULL(c_authorizationGroups.rank, 0) + ISNULL(f_authorizationGroups.rank, 0)");
      sql.append(" AS search_rank");
    }
    sql.append(", count(*) over() as totalCount FROM authorizationGroups");

    if (doFullTextSearch) {
      final String text = query.getText();
      sql.append(
          " LEFT JOIN CONTAINSTABLE (authorizationGroups, (name, description), :containsQuery) c_authorizationGroups"
              + " ON authorizationGroups.uuid = c_authorizationGroups.[Key]"
              + " LEFT JOIN FREETEXTTABLE(authorizationGroups, (name, description), :freetextQuery) f_authorizationGroups"
              + " ON authorizationGroups.uuid = f_authorizationGroups.[Key]");
      whereClauses.add("c_authorizationGroups.rank IS NOT NULL");
      sqlArgs.put("containsQuery", Utils.getSqlServerFullTextQuery(text));
      sqlArgs.put("freetextQuery", text);
    }

    addEqualsClause("status", "authorizationGroups.status", query.getStatus());

    if (query.getPositionUuid() != null) {
      // Search for authorization groups related to a given position
      whereClauses.add(
          "authorizationGroups.uuid IN ( SELECT ap.authorizationGroupUuid FROM authorizationGroupPositions ap "
              + "WHERE ap.positionUuid = :positionUuid )");
      sqlArgs.put("positionUuid", query.getPositionUuid());
    }

    finish(query);
    return getResult(query, new AuthorizationGroupMapper());
  }

  @Override
  protected void getOrderByClauses(AuthorizationGroupSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      orderByClauses.addAll(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
    }

    switch (query.getSortBy()) {
      case CREATED_AT:
        orderByClauses
            .addAll(Utils.addOrderBy(query.getSortOrder(), "authorizationGroups", "createdAt"));
        break;
      case NAME:
      default:
        orderByClauses
            .addAll(Utils.addOrderBy(query.getSortOrder(), "authorizationGroups", "name"));
        break;
    }
    orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, "authorizationGroups", "uuid"));
  }

}

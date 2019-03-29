package mil.dds.anet.search.mssql;

import com.google.common.base.Joiner;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.AuthorizationGroup;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery;
import mil.dds.anet.beans.search.AuthorizationGroupSearchQuery.AuthorizationGroupSearchSortBy;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.database.mappers.AuthorizationGroupMapper;
import mil.dds.anet.search.AbstractSearcherBase;
import mil.dds.anet.search.IAuthorizationGroupSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.jdbi.v3.core.statement.Query;

public class MssqlAuthorizationGroupSearcher extends AbstractSearcherBase
    implements IAuthorizationGroupSearcher {

  @Override
  public AnetBeanList<AuthorizationGroup> runSearch(AuthorizationGroupSearchQuery query) {
    final List<String> whereClauses = new LinkedList<String>();
    final Map<String, Object> sqlArgs = new HashMap<String, Object>();
    final StringBuilder sql =
        new StringBuilder("/* MssqlAuthorizationGroupSearch */ SELECT authorizationGroups.*");

    final String text = query.getText();
    final boolean doFullTextSearch = (text != null && !text.trim().isEmpty());
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
      sql.append(
          " LEFT JOIN CONTAINSTABLE (authorizationGroups, (name, description), :containsQuery) c_authorizationGroups"
              + " ON authorizationGroups.uuid = c_authorizationGroups.[Key]"
              + " LEFT JOIN FREETEXTTABLE(authorizationGroups, (name, description), :freetextQuery) f_authorizationGroups"
              + " ON authorizationGroups.uuid = f_authorizationGroups.[Key]");
      whereClauses.add("c_authorizationGroups.rank IS NOT NULL");
      sqlArgs.put("containsQuery", Utils.getSqlServerFullTextQuery(text));
      sqlArgs.put("freetextQuery", text);
    }

    if (query.getStatus() != null) {
      whereClauses.add("authorizationGroups.status = :status");
      sqlArgs.put("status", DaoUtils.getEnumId(query.getStatus()));
    }

    if (query.getPositionUuid() != null) {
      // Search for authorization groups related to a given position
      whereClauses.add(
          "authorizationGroups.uuid IN ( SELECT ap.authorizationGroupUuid FROM authorizationGroupPositions ap "
              + "WHERE ap.positionUuid = :positionUuid) ");
      sqlArgs.put("positionUuid", query.getPositionUuid());
    }

    if (whereClauses.isEmpty()) {
      return new AnetBeanList<AuthorizationGroup>(query.getPageNum(), query.getPageSize(),
          new ArrayList<AuthorizationGroup>());
    }

    sql.append(" WHERE ");
    sql.append(Joiner.on(" AND ").join(whereClauses));

    // Sort Ordering
    final List<String> orderByClauses = new LinkedList<>();
    if (doFullTextSearch && query.getSortBy() == null) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      orderByClauses.addAll(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
    }

    if (query.getSortBy() == null) {
      query.setSortBy(AuthorizationGroupSearchSortBy.NAME);
    }
    if (query.getSortOrder() == null) {
      query.setSortOrder(SortOrder.ASC);
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
    sql.append(" ORDER BY ");
    sql.append(Joiner.on(", ").join(orderByClauses));

    final Query sqlQuery = MssqlSearcher.addPagination(query, getDbHandle(), sql, sqlArgs);
    return new AnetBeanList<AuthorizationGroup>(sqlQuery, query.getPageNum(), query.getPageSize(),
        new AuthorizationGroupMapper(), null);
  }

}

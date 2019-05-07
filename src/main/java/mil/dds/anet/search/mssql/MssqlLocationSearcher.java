package mil.dds.anet.search.mssql;

import com.google.common.base.Joiner;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.beans.search.LocationSearchQuery.LocationSearchSortBy;
import mil.dds.anet.database.mappers.LocationMapper;
import mil.dds.anet.search.AbstractSearcherBase;
import mil.dds.anet.search.ILocationSearcher;
import mil.dds.anet.utils.DaoUtils;
import mil.dds.anet.utils.Utils;
import org.jdbi.v3.core.statement.Query;

public class MssqlLocationSearcher extends AbstractSearcherBase implements ILocationSearcher {

  @Override
  public AnetBeanList<Location> runSearch(LocationSearchQuery query) {
    final List<String> whereClauses = new LinkedList<String>();
    final Map<String, Object> sqlArgs = new HashMap<String, Object>();
    final StringBuilder sql = new StringBuilder("/* MssqlLocationSearch */ SELECT locations.*");

    final String text = query.getText();
    final boolean doFullTextSearch = (text != null && !text.trim().isEmpty());
    if (doFullTextSearch) {
      // If we're doing a full-text search, add a pseudo-rank
      // so we can sort on it (show the most relevant hits at the top).
      sql.append(", ISNULL(c_locations.rank, 0)");
      sql.append(" AS search_rank");
    }
    sql.append(", count(*) over() as totalCount FROM locations");

    if (doFullTextSearch) {
      sql.append(" LEFT JOIN CONTAINSTABLE (locations, (name), :containsQuery) c_locations"
          + " ON locations.uuid = c_locations.[Key]");
      whereClauses.add("c_locations.rank IS NOT NULL");
      sqlArgs.put("containsQuery", Utils.getSqlServerFullTextQuery(text));
    }

    if (query.getStatus() != null) {
      whereClauses.add("status = :status");
      sqlArgs.put("status", DaoUtils.getEnumId(query.getStatus()));
    }

    if (!whereClauses.isEmpty()) {
      sql.append(" WHERE ");
      sql.append(Joiner.on(" AND ").join(whereClauses));
    }

    // Sort Ordering
    final List<String> orderByClauses = new LinkedList<>();
    if (doFullTextSearch && query.getSortBy() == null) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      orderByClauses.addAll(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
    }

    if (query.getSortBy() == null) {
      query.setSortBy(LocationSearchSortBy.NAME);
    }
    if (query.getSortOrder() == null) {
      query.setSortOrder(SortOrder.ASC);
    }
    switch (query.getSortBy()) {
      case CREATED_AT:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "locations", "createdAt"));
        break;
      case NAME:
      default:
        orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "locations", "name"));
        break;
    }
    orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, "locations", "uuid"));
    sql.append(" ORDER BY ");
    sql.append(Joiner.on(", ").join(orderByClauses));

    final Query sqlQuery = MssqlSearcher.addPagination(query, getDbHandle(), sql, sqlArgs);
    return new AnetBeanList<Location>(sqlQuery, query.getPageNum(), query.getPageSize(),
        new LocationMapper(), null);
  }

}

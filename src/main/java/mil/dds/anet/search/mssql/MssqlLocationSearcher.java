package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.database.mappers.LocationMapper;
import mil.dds.anet.search.ILocationSearcher;
import mil.dds.anet.utils.Utils;

public class MssqlLocationSearcher extends AbstractMssqlSearcherBase<Location, LocationSearchQuery>
    implements ILocationSearcher {

  @Override
  public AnetBeanList<Location> runSearch(LocationSearchQuery query) {
    start("MssqlLocationSearch");
    sql.append("SELECT locations.*");

    if (query.isTextPresent()) {
      // If we're doing a full-text search, add a pseudo-rank
      // so we can sort on it (show the most relevant hits at the top).
      sql.append(", ISNULL(c_locations.rank, 0)");
      sql.append(" AS search_rank");
    }
    sql.append(", count(*) over() as totalCount FROM locations");

    if (query.isTextPresent()) {
      final String text = query.getText();
      sql.append(" LEFT JOIN CONTAINSTABLE (locations, (name), :containsQuery) c_locations"
          + " ON locations.uuid = c_locations.[Key]");
      whereClauses.add("c_locations.rank IS NOT NULL");
      sqlArgs.put("containsQuery", Utils.getSqlServerFullTextQuery(text));
    }

    addEqualsClause("status", "status", query.getStatus());

    finish(query);
    return getResult(query, new LocationMapper());
  }

  @Override
  protected void getOrderByClauses(LocationSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      orderByClauses.addAll(Utils.addOrderBy(SortOrder.DESC, null, "search_rank"));
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
  }

}

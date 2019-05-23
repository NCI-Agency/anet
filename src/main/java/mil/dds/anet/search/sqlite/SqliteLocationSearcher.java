package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.database.mappers.LocationMapper;
import mil.dds.anet.search.ILocationSearcher;
import mil.dds.anet.utils.Utils;

public class SqliteLocationSearcher
    extends AbstractSqliteSearcherBase<Location, LocationSearchQuery> implements ILocationSearcher {

  @Override
  public AnetBeanList<Location> runSearch(LocationSearchQuery query) {
    start("SqliteLocationSearch");
    sql.append("SELECT * FROM locations");

    if (query.isTextPresent()) {
      final String text = query.getText();
      whereClauses.add("(name LIKE '%' || :text || '%')");
      sqlArgs.put("text", Utils.getSqliteFullTextQuery(text));
    }

    addEqualsClause("status", "status", query.getStatus());

    finish(query);
    return getResult(query, new LocationMapper());
  }

  @Override
  protected void getOrderByClauses(LocationSearchQuery query) {
    orderByClauses.addAll(Utils.addOrderBy(query.getSortOrder(), "locations", "name"));
    orderByClauses.addAll(Utils.addOrderBy(SortOrder.ASC, "locations", "uuid"));
  }

}

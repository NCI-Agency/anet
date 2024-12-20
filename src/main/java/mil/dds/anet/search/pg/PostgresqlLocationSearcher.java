package mil.dds.anet.search.pg;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.search.AbstractLocationSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import org.springframework.stereotype.Component;

@Component
public class PostgresqlLocationSearcher extends AbstractLocationSearcher {

  public PostgresqlLocationSearcher(DatabaseHandler databaseHandler) {
    super(databaseHandler, new PostgresqlSearchQueryBuilder<Location, LocationSearchQuery>(
        "PostgresqlLocationSearch"));
  }

  @Override
  protected void addTextQuery(LocationSearchQuery query) {
    addFullTextSearch("locations", query.getText(), query.isSortByPresent());
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, LocationSearchQuery query) {
    if (hasTextQuery(query) && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(getOrderBy(SortOrder.DESC, "search_rank"));
    }
    super.addOrderByClauses(qb, query);
  }

}

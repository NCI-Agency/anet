package mil.dds.anet.search.pg;

import mil.dds.anet.beans.search.EventSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.search.AbstractEventSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import org.springframework.stereotype.Component;

@Component
public class PostgresqlEventSearcher extends AbstractEventSearcher {

  public PostgresqlEventSearcher(DatabaseHandler databaseHandler) {
    super(databaseHandler, new PostgresqlSearchQueryBuilder<>("PostgresqlEventSearch"));
  }

  @Override
  protected void addTextQuery(EventSearchQuery query) {
    addFullTextSearch("events", query.getText(), query.isSortByPresent());
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, EventSearchQuery query) {
    if (hasTextQuery(query) && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(getOrderBy(ISearchQuery.SortOrder.DESC, "search_rank"));
    }
    super.addOrderByClauses(qb, query);
  }
}

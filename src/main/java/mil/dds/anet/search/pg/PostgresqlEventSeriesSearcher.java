package mil.dds.anet.search.pg;

import mil.dds.anet.beans.search.EventSeriesSearchQuery;
import mil.dds.anet.beans.search.ISearchQuery;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.search.AbstractEventSeriesSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import org.springframework.stereotype.Component;

@Component
public class PostgresqlEventSeriesSearcher extends AbstractEventSeriesSearcher {

  public PostgresqlEventSeriesSearcher(DatabaseHandler databaseHandler) {
    super(databaseHandler, new PostgresqlSearchQueryBuilder<>("PostgresqlEventSeriesSearch"));
  }

  @Override
  protected void addTextQuery(EventSeriesSearchQuery query) {
    addFullTextSearch("eventSeries", query.getText(), query.isSortByPresent());
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      EventSeriesSearchQuery query) {
    if (hasTextQuery(query) && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(getOrderBy(ISearchQuery.SortOrder.DESC, "search_rank"));
    }
    super.addOrderByClauses(qb, query);
  }
}

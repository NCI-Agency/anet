package mil.dds.anet.search.pg;

import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PreferenceSearchQuery;
import mil.dds.anet.database.DatabaseHandler;
import mil.dds.anet.search.AbstractPreferenceSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import org.springframework.stereotype.Component;

@Component
public class PostgresqlPreferenceSearcher extends AbstractPreferenceSearcher {

  public PostgresqlPreferenceSearcher(DatabaseHandler databaseHandler) {
    super(databaseHandler, new PostgresqlSearchQueryBuilder<>("PostgresqlPreferenceSearch"));
  }

  @Override
  protected void addTextQuery(PreferenceSearchQuery query) {
    addFullTextSearch("preferences", query.getText(), query.isSortByPresent());
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb,
      PreferenceSearchQuery query) {
    if (hasTextQuery(query) && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(getOrderBy(SortOrder.DESC, "search_rank"));
    }
    super.addOrderByClauses(qb, query);
  }

}

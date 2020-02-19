package mil.dds.anet.search.pg;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.PersonSearchQuery;
import mil.dds.anet.search.AbstractPersonSearcher;
import mil.dds.anet.search.AbstractSearchQueryBuilder;

public class PostgresqlPersonSearcher extends AbstractPersonSearcher {

  public PostgresqlPersonSearcher() {
    super(new PostgresqlSearchQueryBuilder<Person, PersonSearchQuery>("PostgresqlPersonSearch"));
  }

  @Override
  protected void addTextQuery(PersonSearchQuery query) {
    addFullTextSearch("people", query.getText(), query.isSortByPresent());
  }

  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, PersonSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(getOrderBy(SortOrder.DESC, null, "search_rank"));
    }
    super.addOrderByClauses(qb, query);
  }

}

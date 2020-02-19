package mil.dds.anet.search.pg;

import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.TagSearchQuery;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.search.AbstractTagSearcher;

public class PostgresqlTagSearcher extends AbstractTagSearcher {

  public PostgresqlTagSearcher() {
    super(new PostgresqlSearchQueryBuilder<Tag, TagSearchQuery>("PostgresqlTagSearch"));
  }

  @Override
  protected void addTextQuery(TagSearchQuery query) {
    addFullTextSearch("tags", query.getText(), query.isSortByPresent());
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, TagSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(getOrderBy(SortOrder.DESC, null, "search_rank"));
    }
    super.addOrderByClauses(qb, query);
  }

}

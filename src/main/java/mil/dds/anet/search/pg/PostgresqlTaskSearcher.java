package mil.dds.anet.search.pg;

import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.search.AbstractTaskSearcher;

public class PostgresqlTaskSearcher extends AbstractTaskSearcher {

  public PostgresqlTaskSearcher() {
    super(new PostgresqlSearchQueryBuilder<Task, TaskSearchQuery>("PostgresqlTaskSearch"));
  }

  @Override
  protected void addTextQuery(TaskSearchQuery query) {
    addFullTextSearch("tasks", query.getText(), query.isSortByPresent());
  }

  @Override
  protected void addOrderByClauses(AbstractSearchQueryBuilder<?, ?> qb, TaskSearchQuery query) {
    if (query.isTextPresent() && !query.isSortByPresent()) {
      // We're doing a full-text search without an explicit sort order,
      // so sort first on the search pseudo-rank.
      qb.addAllOrderByClauses(getOrderBy(SortOrder.DESC, null, "search_rank"));
    }
    super.addOrderByClauses(qb, query);
  }

}

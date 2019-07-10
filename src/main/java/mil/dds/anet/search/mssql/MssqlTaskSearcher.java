package mil.dds.anet.search.mssql;

import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.search.ISearchQuery.SortOrder;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.search.AbstractSearchQueryBuilder;
import mil.dds.anet.search.AbstractTaskSearcher;

public class MssqlTaskSearcher extends AbstractTaskSearcher {

  public MssqlTaskSearcher() {
    super(new MssqlSearchQueryBuilder<Task, TaskSearchQuery>("MssqlTaskSearch"));
  }

  @Override
  protected void addTextQuery(TaskSearchQuery query) {
    // If we're doing a full-text search, add a pseudo-rank (giving LIKE matches the highest
    // possible score)
    // so we can sort on it (show the most relevant hits at the top).
    qb.addSelectClause("ISNULL(c_tasks.rank, 0)"
        + " + CASE WHEN tasks.shortName LIKE :likeQuery THEN 1000 ELSE 0 END" + " AS search_rank");
    qb.addFromClause("LEFT JOIN CONTAINSTABLE (tasks, (longName), :containsQuery) c_tasks"
        + " ON tasks.uuid = c_tasks.[Key]");
    qb.addWhereClause("(c_tasks.rank IS NOT NULL OR tasks.shortName LIKE :likeQuery)");
    final String text = query.getText();
    qb.addSqlArg("containsQuery", qb.getFullTextQuery(text));
    qb.addSqlArg("likeQuery", qb.getLikeQuery(text));
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

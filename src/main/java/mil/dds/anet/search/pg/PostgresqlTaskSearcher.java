package mil.dds.anet.search.pg;

import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.search.TaskSearchQuery;
import mil.dds.anet.search.AbstractTaskSearcher;

public class PostgresqlTaskSearcher extends AbstractTaskSearcher {

  public PostgresqlTaskSearcher() {
    super(new PostgresqlSearchQueryBuilder<Task, TaskSearchQuery>("PostgresqlTaskSearch"));
  }

  @Override
  protected void addTextQuery(TaskSearchQuery query) {
    final String text = qb.getContainsQuery(query.getText());
    qb.addLikeClauses("text", new String[] {"tasks.\"longName\"", "tasks.\"shortName\""}, text);
  }

}

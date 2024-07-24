package mil.dds.anet.search.pg;

import mil.dds.anet.beans.search.EventSearchQuery;
import mil.dds.anet.search.AbstractEventSearcher;

public class PostgresqlEventSearcher extends AbstractEventSearcher {

  public PostgresqlEventSearcher() {
    super(new PostgresqlSearchQueryBuilder<>("PostgresqlEventSearch"));
  }

  @Override
  protected void addTextQuery(EventSearchQuery query) {
    addFullTextSearch("events", query.getText(), query.isSortByPresent());
  }
}

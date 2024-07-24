package mil.dds.anet.search.pg;

import mil.dds.anet.beans.search.EventSeriesSearchQuery;
import mil.dds.anet.search.AbstractEventSeriesSearcher;

public class PostgresqlEventSeriesSearcher extends AbstractEventSeriesSearcher {

  public PostgresqlEventSeriesSearcher() {
    super(new PostgresqlSearchQueryBuilder<>("PostgresqlEventSeriesSearch"));
  }

  @Override
  protected void addTextQuery(EventSeriesSearchQuery query) {
    addFullTextSearch("eventSeries", query.getText(), query.isSortByPresent());
  }
}

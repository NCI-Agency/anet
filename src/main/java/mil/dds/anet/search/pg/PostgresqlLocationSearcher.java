package mil.dds.anet.search.pg;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.search.AbstractLocationSearcher;

public class PostgresqlLocationSearcher extends AbstractLocationSearcher {

  public PostgresqlLocationSearcher() {
    super(new PostgresqlSearchQueryBuilder<Location, LocationSearchQuery>(
        "PostgresqlLocationSearch"));
  }

  @Override
  protected void addTextQuery(LocationSearchQuery query) {
    final String text = qb.getFullTextQuery(query.getText());
    qb.addLikeClause("text", "locations.name", text);
  }

}

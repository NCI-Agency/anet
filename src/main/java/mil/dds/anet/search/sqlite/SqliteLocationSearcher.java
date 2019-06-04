package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.search.AbstractLocationSearcher;

public class SqliteLocationSearcher extends AbstractLocationSearcher {

  public SqliteLocationSearcher() {
    super(new SqliteSearchQueryBuilder<Location, LocationSearchQuery>("SqliteLocationSearch"));
  }

  @Override
  protected void addTextQuery(LocationSearchQuery query) {
    final String text = qb.getFullTextQuery(query.getText());
    qb.addLikeClause("text", "locations.name", text);
  }

}

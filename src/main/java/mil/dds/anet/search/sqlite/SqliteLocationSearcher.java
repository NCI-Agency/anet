package mil.dds.anet.search.sqlite;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.search.LocationSearchQuery;
import mil.dds.anet.search.AbstractLocationSearcher;
import mil.dds.anet.utils.Utils;

public class SqliteLocationSearcher extends AbstractLocationSearcher {

  public SqliteLocationSearcher() {
    super(new SqliteSearchQueryBuilder<Location, LocationSearchQuery>("SqliteLocationSearch"));
  }

  @Override
  protected void addTextQuery(LocationSearchQuery query) {
    qb.addWhereClause("(locations.name LIKE '%' || :text || '%')");
    final String text = query.getText();
    qb.addSqlArg("text", Utils.getSqliteFullTextQuery(text));
  }

}

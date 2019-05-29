package mil.dds.anet.search.sqlite;

import com.google.inject.Injector;
import mil.dds.anet.search.Searcher;

public class SqliteSearcher extends Searcher {

  public SqliteSearcher(Injector injector) {
    super(injector.getInstance(SqliteReportSearcher.class),
        injector.getInstance(SqlitePersonSearcher.class),
        injector.getInstance(SqliteOrganizationSearcher.class),
        injector.getInstance(SqlitePositionSearcher.class),
        injector.getInstance(SqliteTaskSearcher.class),
        injector.getInstance(SqliteLocationSearcher.class),
        injector.getInstance(SqliteTagSearcher.class),
        injector.getInstance(SqliteAuthorizationGroupSearcher.class));
  }

}

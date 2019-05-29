package mil.dds.anet.search.pg;

import com.google.inject.Injector;
import mil.dds.anet.search.IReportSearcher;
import mil.dds.anet.search.sqlite.SqliteSearcher;

public class PostgresqlSearcher extends SqliteSearcher {

  public PostgresqlSearcher(Injector injector) {
    super(injector);
  }

  @Override
  public IReportSearcher getReportSearcher() {
    return injector.getInstance(PostgresqlReportSearcher.class);
  }

}

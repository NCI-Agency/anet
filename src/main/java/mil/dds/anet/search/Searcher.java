package mil.dds.anet.search;

import com.google.inject.Injector;
import mil.dds.anet.search.mssql.MssqlSearcher;
import mil.dds.anet.search.pg.PostgresqlSearcher;
import mil.dds.anet.search.sqlite.SqliteSearcher;
import mil.dds.anet.utils.DaoUtils;

public abstract class Searcher implements ISearcher {

  protected final Injector injector;

  protected Searcher(Injector injector) {
    this.injector = injector;
  }

  public static Searcher getSearcher(DaoUtils.DbType dbType, Injector injector) {
    switch (dbType) {
      case MSSQL:
        return new MssqlSearcher(injector);
      case SQLITE:
        return new SqliteSearcher(injector);
      case POSTGRESQL:
        return new PostgresqlSearcher(injector);
      default:
        throw new RuntimeException("No searcher found for " + dbType);
    }
  }

}

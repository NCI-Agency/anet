package mil.dds.anet.search.sqlite;

import com.google.inject.Injector;
import mil.dds.anet.search.IAuthorizationGroupSearcher;
import mil.dds.anet.search.ILocationSearcher;
import mil.dds.anet.search.IOrganizationSearcher;
import mil.dds.anet.search.IPersonSearcher;
import mil.dds.anet.search.IPositionSearcher;
import mil.dds.anet.search.IReportSearcher;
import mil.dds.anet.search.ITagSearcher;
import mil.dds.anet.search.ITaskSearcher;
import mil.dds.anet.search.Searcher;

public class SqliteSearcher extends Searcher {

  public SqliteSearcher(Injector injector) {
    super(injector);
  }

  @Override
  public IAuthorizationGroupSearcher getAuthorizationGroupSearcher() {
    return injector.getInstance(SqliteAuthorizationGroupSearcher.class);
  }

  @Override
  public ILocationSearcher getLocationSearcher() {
    return injector.getInstance(SqliteLocationSearcher.class);
  }

  @Override
  public IOrganizationSearcher getOrganizationSearcher() {
    return injector.getInstance(SqliteOrganizationSearcher.class);
  }

  @Override
  public IPersonSearcher getPersonSearcher() {
    return injector.getInstance(SqlitePersonSearcher.class);
  }

  @Override
  public IPositionSearcher getPositionSearcher() {
    return injector.getInstance(SqlitePositionSearcher.class);
  }

  @Override
  public IReportSearcher getReportSearcher() {
    return injector.getInstance(SqliteReportSearcher.class);
  }

  @Override
  public ITagSearcher getTagSearcher() {
    return injector.getInstance(SqliteTagSearcher.class);
  }

  @Override
  public ITaskSearcher getTaskSearcher() {
    return injector.getInstance(SqliteTaskSearcher.class);
  }

}

package mil.dds.anet.search.pg;

import com.google.inject.Injector;
import mil.dds.anet.search.IAttachmentSearcher;
import mil.dds.anet.search.IAuthorizationGroupSearcher;
import mil.dds.anet.search.ILocationSearcher;
import mil.dds.anet.search.IOrganizationSearcher;
import mil.dds.anet.search.IPersonSearcher;
import mil.dds.anet.search.IPositionSearcher;
import mil.dds.anet.search.IReportSearcher;
import mil.dds.anet.search.ISubscriptionSearcher;
import mil.dds.anet.search.ISubscriptionUpdateSearcher;
import mil.dds.anet.search.ITaskSearcher;
import mil.dds.anet.search.IUserActivitySearcher;
import mil.dds.anet.search.Searcher;

public class PostgresqlSearcher extends Searcher {

  public PostgresqlSearcher(Injector injector) {
    super(injector);
  }

  @Override
  public IAuthorizationGroupSearcher getAuthorizationGroupSearcher() {
    return injector.getInstance(PostgresqlAuthorizationGroupSearcher.class);
  }

  @Override
  public ILocationSearcher getLocationSearcher() {
    return injector.getInstance(PostgresqlLocationSearcher.class);
  }

  @Override
  public IOrganizationSearcher getOrganizationSearcher() {
    return injector.getInstance(PostgresqlOrganizationSearcher.class);
  }

  @Override
  public IPersonSearcher getPersonSearcher() {
    return injector.getInstance(PostgresqlPersonSearcher.class);
  }

  @Override
  public IPositionSearcher getPositionSearcher() {
    return injector.getInstance(PostgresqlPositionSearcher.class);
  }

  @Override
  public IReportSearcher getReportSearcher() {
    return injector.getInstance(PostgresqlReportSearcher.class);
  }

  @Override
  public ISubscriptionSearcher getSubscriptionSearcher() {
    return injector.getInstance(PostgresqlSubscriptionSearcher.class);
  }

  @Override
  public ISubscriptionUpdateSearcher getSubscriptionUpdateSearcher() {
    return injector.getInstance(PostgresqlSubscriptionUpdateSearcher.class);
  }

  @Override
  public ITaskSearcher getTaskSearcher() {
    return injector.getInstance(PostgresqlTaskSearcher.class);
  }

  @Override
  public IUserActivitySearcher getUserActivitySearcher() {
    return injector.getInstance(PostgresqlUserActivitySearcher.class);
  }

  @Override
  public IAttachmentSearcher getAttachmentSearcher() {
    return injector.getInstance(PostgresqlAttachmentSearcher.class);
  }

}

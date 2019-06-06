package mil.dds.anet.search.mssql;

import com.google.inject.Injector;
import mil.dds.anet.search.IAuthorizationGroupSearcher;
import mil.dds.anet.search.ILocationSearcher;
import mil.dds.anet.search.IOrganizationSearcher;
import mil.dds.anet.search.IPersonSearcher;
import mil.dds.anet.search.IPositionSearcher;
import mil.dds.anet.search.IReportSearcher;
import mil.dds.anet.search.ISubscriptionSearcher;
import mil.dds.anet.search.ISubscriptionUpdateSearcher;
import mil.dds.anet.search.ITagSearcher;
import mil.dds.anet.search.ITaskSearcher;
import mil.dds.anet.search.Searcher;

public class MssqlSearcher extends Searcher {

  public MssqlSearcher(Injector injector) {
    super(injector);
  }

  @Override
  public IAuthorizationGroupSearcher getAuthorizationGroupSearcher() {
    return injector.getInstance(MssqlAuthorizationGroupSearcher.class);
  }

  @Override
  public ILocationSearcher getLocationSearcher() {
    return injector.getInstance(MssqlLocationSearcher.class);
  }

  @Override
  public IOrganizationSearcher getOrganizationSearcher() {
    return injector.getInstance(MssqlOrganizationSearcher.class);
  }

  @Override
  public IPersonSearcher getPersonSearcher() {
    return injector.getInstance(MssqlPersonSearcher.class);
  }

  @Override
  public IPositionSearcher getPositionSearcher() {
    return injector.getInstance(MssqlPositionSearcher.class);
  }

  @Override
  public IReportSearcher getReportSearcher() {
    return injector.getInstance(MssqlReportSearcher.class);
  }

  @Override
  public ISubscriptionSearcher getSubscriptionSearcher() {
    return injector.getInstance(MssqlSubscriptionSearcher.class);
  }

  @Override
  public ISubscriptionUpdateSearcher getSubscriptionUpdateSearcher() {
    return injector.getInstance(MssqlSubscriptionUpdateSearcher.class);
  }

  @Override
  public ITagSearcher getTagSearcher() {
    return injector.getInstance(MssqlTagSearcher.class);
  }

  @Override
  public ITaskSearcher getTaskSearcher() {
    return injector.getInstance(MssqlTaskSearcher.class);
  }

}

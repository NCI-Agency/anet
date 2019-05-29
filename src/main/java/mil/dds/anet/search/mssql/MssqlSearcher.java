package mil.dds.anet.search.mssql;

import com.google.inject.Injector;
import mil.dds.anet.search.Searcher;

public class MssqlSearcher extends Searcher {

  public MssqlSearcher(Injector injector) {
    super(injector.getInstance(MssqlReportSearcher.class),
        injector.getInstance(MssqlPersonSearcher.class),
        injector.getInstance(MssqlOrganizationSearcher.class),
        injector.getInstance(MssqlPositionSearcher.class),
        injector.getInstance(MssqlTaskSearcher.class),
        injector.getInstance(MssqlLocationSearcher.class),
        injector.getInstance(MssqlTagSearcher.class),
        injector.getInstance(MssqlAuthorizationGroupSearcher.class));
  }

}

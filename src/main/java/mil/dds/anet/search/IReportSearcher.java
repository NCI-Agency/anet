package mil.dds.anet.search;

import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ReportSearchQuery;

public interface IReportSearcher {

  public AnetBeanList<Report> runSearch(ReportSearchQuery query);

}

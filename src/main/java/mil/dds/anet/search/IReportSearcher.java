package mil.dds.anet.search;

import java.util.Set;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ReportSearchQuery;

public interface IReportSearcher {

  public AnetBeanList<Report> runSearch(Set<String> subFields, ReportSearchQuery query);

}

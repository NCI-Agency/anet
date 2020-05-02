package mil.dds.anet.search;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.beans.Report;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.ReportSearchQuery;

public interface IReportSearcher {

  public CompletableFuture<AnetBeanList<Report>> runSearch(Map<String, Object> context,
      Set<String> subFields, ReportSearchQuery query);

}

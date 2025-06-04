package mil.dds.anet.search;

import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.mart.MartImportedReport;
import mil.dds.anet.beans.search.MartImportedReportSearchQuery;

public interface IMartImportedReportSearcher {
  AnetBeanList<MartImportedReport> runSearch(final MartImportedReportSearchQuery query);
}

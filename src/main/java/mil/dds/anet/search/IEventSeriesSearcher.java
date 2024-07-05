package mil.dds.anet.search;

import mil.dds.anet.beans.EventSeries;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.EventSeriesSearchQuery;

public interface IEventSeriesSearcher {
  AnetBeanList<EventSeries> runSearch(EventSeriesSearchQuery query);
}

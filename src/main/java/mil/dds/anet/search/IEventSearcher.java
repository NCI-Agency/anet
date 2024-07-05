package mil.dds.anet.search;

import mil.dds.anet.beans.Event;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.EventSearchQuery;

public interface IEventSearcher {
  AnetBeanList<Event> runSearch(EventSearchQuery query);
}

package mil.dds.anet.search;

import mil.dds.anet.beans.UserActivity;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.UserActivitySearchQuery;

public interface IUserActivitySearcher {
  AnetBeanList<UserActivity> runSearch(final UserActivitySearchQuery query);
}

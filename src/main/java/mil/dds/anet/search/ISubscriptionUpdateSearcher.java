package mil.dds.anet.search;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.SubscriptionUpdate;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.SubscriptionUpdateSearchQuery;

public interface ISubscriptionUpdateSearcher {

	public AnetBeanList<SubscriptionUpdate> runSearch(SubscriptionUpdateSearchQuery query, Person user);

}

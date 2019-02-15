package mil.dds.anet.search;

import org.jdbi.v3.core.Handle;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Subscription;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.SubscriptionSearchQuery;

public interface ISubscriptionSearcher {

	public AnetBeanList<Subscription> runSearch(SubscriptionSearchQuery query, Handle dbHandle, Person user);

}

package mil.dds.anet.database;

import org.jdbi.v3.core.Handle;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.SubscriptionUpdate;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.SubscriptionUpdateSearchQuery;

public class SubscriptionUpdateDao {

	private final Handle dbHandle;

	public SubscriptionUpdateDao(Handle dbHandle) {
		this.dbHandle = dbHandle;
	}

	public AnetBeanList<SubscriptionUpdate> search(Person user, SubscriptionUpdateSearchQuery query) {
		return AnetObjectEngine.getInstance().getSearcher().getSubscriptionUpdateSearcher()
				.runSearch(query, dbHandle, user);
	}

}

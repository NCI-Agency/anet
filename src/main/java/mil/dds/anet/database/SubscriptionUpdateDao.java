package mil.dds.anet.database;

import javax.inject.Inject;
import javax.inject.Provider;

import org.jdbi.v3.core.Handle;

import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.SubscriptionUpdate;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.SubscriptionUpdateSearchQuery;
import ru.vyarus.guicey.jdbi3.tx.InTransaction;

@InTransaction
public class SubscriptionUpdateDao {

	@Inject
	private Provider<Handle> handle;

	protected Handle getDbHandle() {
		return handle.get();
	}

	public AnetBeanList<SubscriptionUpdate> search(Person user, SubscriptionUpdateSearchQuery query) {
		return AnetObjectEngine.getInstance().getSearcher().getSubscriptionUpdateSearcher()
				.runSearch(query, user);
	}

}

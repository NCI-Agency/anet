package mil.dds.anet.search;

import org.skife.jdbi.v2.Handle;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PersonSearchQuery;

public interface IPersonSearcher {

	public AnetBeanList<Person> runSearch(PersonSearchQuery query, Handle dbHandle);
	
}

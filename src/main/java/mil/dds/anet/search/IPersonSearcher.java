package mil.dds.anet.search;

import org.jdbi.v3.core.Handle;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PersonSearchQuery;

public interface IPersonSearcher {

	public AnetBeanList<Person> runSearch(PersonSearchQuery query, Handle dbHandle);
	
}

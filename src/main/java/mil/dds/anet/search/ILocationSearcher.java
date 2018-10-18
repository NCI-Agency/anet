package mil.dds.anet.search;

import org.skife.jdbi.v2.Handle;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.LocationSearchQuery;

public interface ILocationSearcher {

	public AnetBeanList<Location> runSearch(LocationSearchQuery query, Handle dbHandle);
	
}

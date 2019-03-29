package mil.dds.anet.search;

import mil.dds.anet.beans.Location;
import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.LocationSearchQuery;

public interface ILocationSearcher {

  public AnetBeanList<Location> runSearch(LocationSearchQuery query, Person user);

}

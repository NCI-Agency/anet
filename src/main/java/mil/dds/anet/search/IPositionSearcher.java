package mil.dds.anet.search;

import mil.dds.anet.beans.Person;
import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PositionSearchQuery;

public interface IPositionSearcher {

	public AnetBeanList<Position> runSearch(PositionSearchQuery query, Person user);
	
}

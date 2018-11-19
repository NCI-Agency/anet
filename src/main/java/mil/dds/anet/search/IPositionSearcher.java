package mil.dds.anet.search;

import org.jdbi.v3.core.Handle;

import mil.dds.anet.beans.Position;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.PositionSearchQuery;

public interface IPositionSearcher {

	public AnetBeanList<Position> runSearch(PositionSearchQuery query, Handle dbHandle);
	
}

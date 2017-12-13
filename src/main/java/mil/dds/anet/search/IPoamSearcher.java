package mil.dds.anet.search;

import org.skife.jdbi.v2.Handle;

import mil.dds.anet.beans.lists.AbstractAnetBeanList.TaskList;
import mil.dds.anet.beans.search.PoamSearchQuery;

public interface IPoamSearcher {

	public TaskList runSearch(PoamSearchQuery query, Handle dbHandle);
	
	
}

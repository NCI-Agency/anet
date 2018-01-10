package mil.dds.anet.search;

import org.skife.jdbi.v2.Handle;

import mil.dds.anet.beans.lists.AbstractAnetBeanList.TaskList;
import mil.dds.anet.beans.search.TaskSearchQuery;

public interface ITaskSearcher {

	public TaskList runSearch(TaskSearchQuery query, Handle dbHandle);
	
	
}

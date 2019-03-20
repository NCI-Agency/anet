package mil.dds.anet.search;

import mil.dds.anet.beans.Task;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TaskSearchQuery;

public interface ITaskSearcher {

	public AnetBeanList<Task> runSearch(TaskSearchQuery query);
	
	
}

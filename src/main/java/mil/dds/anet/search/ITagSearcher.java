package mil.dds.anet.search;

import org.skife.jdbi.v2.Handle;

import mil.dds.anet.beans.lists.AbstractAnetBeanList.TagList;
import mil.dds.anet.beans.search.TagSearchQuery;

public interface ITagSearcher {

	public TagList runSearch(TagSearchQuery query, Handle dbHandle);

}

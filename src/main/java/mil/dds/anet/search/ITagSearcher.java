package mil.dds.anet.search;

import mil.dds.anet.beans.Tag;
import mil.dds.anet.beans.lists.AnetBeanList;
import mil.dds.anet.beans.search.TagSearchQuery;

public interface ITagSearcher {

  public AnetBeanList<Tag> runSearch(TagSearchQuery query);

}

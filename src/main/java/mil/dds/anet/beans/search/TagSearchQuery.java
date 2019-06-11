package mil.dds.anet.beans.search;

public class TagSearchQuery extends AbstractSearchQuery<TagSearchSortBy> {

  public TagSearchQuery() {
    super(TagSearchSortBy.NAME);
  }

}

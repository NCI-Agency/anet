package mil.dds.anet.beans.search;

public class TagSearchQuery extends AbstractSearchQuery<TagSearchSortBy> {

  public TagSearchQuery() {
    super(TagSearchSortBy.NAME);
  }

  @Override
  public TagSearchQuery clone() throws CloneNotSupportedException {
    return (TagSearchQuery) super.clone();
  }

}

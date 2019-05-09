package mil.dds.anet.beans.search;

public class TagSearchQuery extends AbstractSearchQuery {

  public enum TagSearchSortBy {
    CREATED_AT, NAME
  }

  private TagSearchSortBy sortBy;

  public TagSearchSortBy getSortBy() {
    return sortBy;
  }

  public void setSortBy(TagSearchSortBy sortBy) {
    this.sortBy = sortBy;
  }

  public static TagSearchQuery withText(String text, int pageNum, int pageSize) {
    final TagSearchQuery query = new TagSearchQuery();
    query.setText(text);
    query.setPageNum(pageNum);
    query.setPageSize(pageSize);
    return query;
  }

}

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

}

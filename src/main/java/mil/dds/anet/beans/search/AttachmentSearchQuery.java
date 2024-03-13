package mil.dds.anet.beans.search;

public class AttachmentSearchQuery extends AbstractSearchQuery<AttachmentSearchSortBy> {

  public AttachmentSearchQuery() {
    super(AttachmentSearchSortBy.CREATED_AT);
    this.setSortOrder(SortOrder.DESC);
  }

  @Override
  public AttachmentSearchQuery clone() throws CloneNotSupportedException {
    return (AttachmentSearchQuery) super.clone();
  }
}

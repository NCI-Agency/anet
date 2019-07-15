package mil.dds.anet.beans.search;

public interface ISearchQuery<T extends ISortBy> {
  public enum SortOrder {
    ASC, DESC
  }

  public boolean isTextPresent();

  public String getText();

  public void setText(String text);

  public int getPageNum();

  public void setPageNum(Integer pageNum);

  public int getPageSize();

  public void setPageSize(Integer pageSize);

  public SortOrder getSortOrder();

  public void setSortOrder(SortOrder sortOrder);

  public boolean isSortByPresent();

  public T getSortBy();

  public void setSortBy(T sortBy);

  boolean isBatchParamsPresent();

  public AbstractBatchParams getBatchParams();

  void setBatchParams(AbstractBatchParams batchParams);
}

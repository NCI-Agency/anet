package mil.dds.anet.beans.search;

import mil.dds.anet.beans.WithStatus;

public interface ISearchQuery<T extends ISortBy> extends WithStatus {
  public enum SortOrder {
    ASC, DESC
  }

  public enum RecurseStrategy {
    NONE, CHILDREN, PARENTS
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

  public boolean isBatchParamsPresent();

  public AbstractBatchParams<?, ?> getBatchParams();

  public void setBatchParams(AbstractBatchParams<?, ?> batchParams);
}

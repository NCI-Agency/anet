package mil.dds.anet.beans.search;

public interface ISearchQuery {
  // marker interface

  public enum SortOrder {
    ASC, DESC
  }

  public String getText();

  public void setText(String text);

  public int getPageNum();

  public void setPageNum(int pageNum);

  public int getPageSize();

  public void setPageSize(int pageSize);
}

package mil.dds.anet.beans.search;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties({"user", "pass"})
public abstract class AbstractSearchQuery implements ISearchQuery {

  private String text;
  private int pageNum;
  private int pageSize;

  public AbstractSearchQuery() {
    this.pageNum = 0;
    this.pageSize = 10;
  }

  @Override
  public String getText() {
    return text;
  }

  @Override
  public void setText(String text) {
    this.text = text;
  }

  @Override
  public int getPageNum() {
    return pageNum;
  }

  @Override
  public void setPageNum(int pageNum) {
    this.pageNum = pageNum;
  }

  @Override
  public int getPageSize() {
    return pageSize;
  }

  @Override
  public void setPageSize(int pageSize) {
    this.pageSize = pageSize;
  }

}

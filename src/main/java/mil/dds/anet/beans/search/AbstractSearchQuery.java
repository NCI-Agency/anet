package mil.dds.anet.beans.search;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.leangen.graphql.annotations.GraphQLIgnore;
import java.util.Optional;
import javax.annotation.Nonnull;

@JsonIgnoreProperties({"user", "pass"})
public abstract class AbstractSearchQuery<T extends ISortBy> implements ISearchQuery<T> {

  protected final T defaultSortBy;

  private static int DEFAULT_PAGENUM = 0;
  private static int DEFAULT_PAGESIZE = 10;
  private static SortOrder DEFAULT_SORTORDER = SortOrder.ASC;

  private Optional<String> text = Optional.empty();
  private Optional<Integer> pageNum = Optional.empty();
  private Optional<Integer> pageSize = Optional.empty();
  private Optional<SortOrder> sortOrder = Optional.empty();
  private Optional<T> sortBy = Optional.empty();

  public AbstractSearchQuery(T defaultSortBy) {
    this.defaultSortBy = defaultSortBy;
  }

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public boolean isTextPresent() {
    return text.isPresent() && !text.get().trim().isEmpty();
  }

  @Override
  public String getText() {
    return text.orElse(null);
  }

  @Override
  public void setText(String text) {
    this.text = Optional.ofNullable(text);
  }

  @Override
  @Nonnull
  public int getPageNum() {
    return pageNum.orElse(DEFAULT_PAGENUM);
  }

  @Override
  public void setPageNum(Integer pageNum) {
    this.pageNum = Optional.ofNullable(pageNum);
  }

  @Override
  @Nonnull
  public int getPageSize() {
    return pageSize.orElse(DEFAULT_PAGESIZE);
  }

  @Override
  public void setPageSize(Integer pageSize) {
    this.pageSize = Optional.ofNullable(pageSize);
  }

  @Override
  @Nonnull
  public SortOrder getSortOrder() {
    return sortOrder.orElse(DEFAULT_SORTORDER);
  }

  @Override
  public void setSortOrder(SortOrder sortOrder) {
    this.sortOrder = Optional.ofNullable(sortOrder);
  }

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public boolean isSortByPresent() {
    return sortBy.isPresent();
  }

  @Override
  @Nonnull
  public T getSortBy() {
    return sortBy.orElse(defaultSortBy);
  }

  @Override
  public void setSortBy(T sortBy) {
    this.sortBy = Optional.ofNullable(sortBy);
  }

}

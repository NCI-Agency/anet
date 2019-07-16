package mil.dds.anet.beans.search;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.leangen.graphql.annotations.GraphQLIgnore;
import java.util.Objects;
import java.util.Optional;
import javax.annotation.Nonnull;

@JsonIgnoreProperties({"user", "pass"})
public abstract class AbstractSearchQuery<T extends ISortBy> implements ISearchQuery<T>, Cloneable {

  protected final T defaultSortBy;

  private static int DEFAULT_PAGENUM = 0;
  private static int DEFAULT_PAGESIZE = 10;
  private static SortOrder DEFAULT_SORTORDER = SortOrder.ASC;

  private Optional<String> text = Optional.empty();
  private Optional<Integer> pageNum = Optional.empty();
  private Optional<Integer> pageSize = Optional.empty();
  private Optional<SortOrder> sortOrder = Optional.empty();
  private Optional<T> sortBy = Optional.empty();
  private Optional<AbstractBatchParams<?, ?>> batchParams = Optional.empty();

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

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public boolean isBatchParamsPresent() {
    return batchParams.isPresent();
  }

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public AbstractBatchParams<?, ?> getBatchParams() {
    return batchParams.orElse(null);
  }

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public void setBatchParams(AbstractBatchParams<?, ?> batchParams) {
    this.batchParams = Optional.ofNullable(batchParams);
  }

  @Override
  public int hashCode() {
    return Objects.hash(text, pageNum, pageSize, sortOrder, sortBy, batchParams);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof AbstractSearchQuery)) {
      return false;
    }
    @SuppressWarnings("unchecked")
    final AbstractSearchQuery<T> other = (AbstractSearchQuery<T>) obj;
    return Objects.equals(getText(), other.getText())
        && Objects.equals(getPageNum(), other.getPageNum())
        && Objects.equals(getPageSize(), other.getPageSize())
        && Objects.equals(getSortOrder(), other.getSortOrder())
        && Objects.equals(getSortBy(), other.getSortBy())
        && Objects.equals(getBatchParams(), other.getBatchParams());
  }

  @Override
  public Object clone() throws CloneNotSupportedException {
    @SuppressWarnings("unchecked")
    final AbstractSearchQuery<T> clone = (AbstractSearchQuery<T>) super.clone();
    if (isBatchParamsPresent()) {
      clone.setBatchParams((AbstractBatchParams<?, ?>) getBatchParams().clone());
    }
    return clone;
  }

}

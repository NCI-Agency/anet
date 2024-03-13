package mil.dds.anet.beans.search;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import jakarta.annotation.Nonnull;
import java.util.Objects;
import java.util.Optional;
import mil.dds.anet.beans.Person;

public abstract class AbstractSearchQuery<T extends ISortBy> implements ISearchQuery<T>, Cloneable {

  protected final T defaultSortBy;

  private static int DEFAULT_PAGENUM = 0;
  private static int DEFAULT_PAGESIZE = 10;
  private static SortOrder DEFAULT_SORTORDER = SortOrder.ASC;

  // annotated below
  private Optional<Status> status = Optional.empty();
  // annotated below
  private Optional<String> text = Optional.empty();
  // annotated below
  private Optional<Integer> pageNum = Optional.empty();
  // annotated below
  private Optional<Integer> pageSize = Optional.empty();
  // annotated below
  private Optional<SortOrder> sortOrder = Optional.empty();
  // annotated below
  private Optional<T> sortBy = Optional.empty();
  // internal search parameter:
  private Optional<AbstractBatchParams<?, ?>> batchParams = Optional.empty();
  @GraphQLQuery
  @GraphQLInputField
  private Boolean inMyReports;
  // internal search parameter:
  @JsonIgnore
  private Person user;

  public AbstractSearchQuery(T defaultSortBy) {
    this.defaultSortBy = defaultSortBy;
  }

  @Override
  @GraphQLQuery
  public Status getStatus() {
    return status.orElse(null);
  }

  @Override
  @GraphQLInputField
  public void setStatus(Status status) {
    this.status = Optional.ofNullable(status);
  }

  @Override
  @JsonIgnore
  public boolean isTextPresent() {
    return text.isPresent() && !text.get().trim().isEmpty();
  }

  @Override
  @GraphQLQuery(name = "text")
  public String getText() {
    return text.orElse(null);
  }

  @Override
  @GraphQLInputField(name = "text")
  public void setText(String text) {
    this.text = Optional.ofNullable(text);
  }

  @Override
  @GraphQLQuery(name = "pageNum")
  @Nonnull
  public int getPageNum() {
    return pageNum.orElse(DEFAULT_PAGENUM);
  }

  @Override
  @GraphQLInputField(name = "pageNum")
  public void setPageNum(Integer pageNum) {
    this.pageNum = Optional.ofNullable(pageNum);
  }

  @Override
  @GraphQLQuery(name = "pageSize")
  @Nonnull
  public int getPageSize() {
    return pageSize.orElse(DEFAULT_PAGESIZE);
  }

  @Override
  @GraphQLInputField(name = "pageSize")
  public void setPageSize(Integer pageSize) {
    this.pageSize = Optional.ofNullable(pageSize);
  }

  @Override
  @GraphQLQuery(name = "sortOrder")
  @Nonnull
  public SortOrder getSortOrder() {
    return sortOrder.orElse(DEFAULT_SORTORDER);
  }

  @Override
  @GraphQLInputField(name = "sortOrder")
  public void setSortOrder(SortOrder sortOrder) {
    this.sortOrder = Optional.ofNullable(sortOrder);
  }

  @Override
  @JsonIgnore
  public boolean isSortByPresent() {
    return sortBy.isPresent();
  }

  @Override
  @GraphQLQuery(name = "sortBy")
  @Nonnull
  public T getSortBy() {
    return sortBy.orElse(defaultSortBy);
  }

  @Override
  @GraphQLInputField(name = "sortBy")
  public void setSortBy(T sortBy) {
    this.sortBy = Optional.ofNullable(sortBy);
  }

  @Override
  @JsonIgnore
  public boolean isBatchParamsPresent() {
    return batchParams.isPresent();
  }

  @Override
  @JsonIgnore
  public AbstractBatchParams<?, ?> getBatchParams() {
    return batchParams.orElse(null);
  }

  @Override
  @JsonIgnore
  public void setBatchParams(AbstractBatchParams<?, ?> batchParams) {
    if (batchParams != null) {
      // batching, so no pagination!
      setPageSize(0);
      setPageNum(0);
    }
    this.batchParams = Optional.ofNullable(batchParams);
  }

  public Boolean isInMyReports() {
    return inMyReports;
  }

  public void setInMyReports(Boolean inMyReports) {
    this.inMyReports = inMyReports;
  }

  @Override
  public int hashCode() {
    return Objects.hash(status, text, pageNum, pageSize, sortOrder, sortBy, inMyReports,
        batchParams, user);
  }

  @Override
  public boolean equals(Object obj) {
    if (!(obj instanceof AbstractSearchQuery)) {
      return false;
    }
    @SuppressWarnings("unchecked")
    final AbstractSearchQuery<T> other = (AbstractSearchQuery<T>) obj;
    return Objects.equals(getStatus(), other.getStatus())
        && Objects.equals(getText(), other.getText())
        && Objects.equals(getPageNum(), other.getPageNum())
        && Objects.equals(getPageSize(), other.getPageSize())
        && Objects.equals(getSortOrder(), other.getSortOrder())
        && Objects.equals(getSortBy(), other.getSortBy())
        && Objects.equals(isInMyReports(), other.isInMyReports())
        && Objects.equals(getBatchParams(), other.getBatchParams())
        && Objects.equals(getUser(), other.getUser());
  }

  @Override
  public AbstractSearchQuery<T> clone() throws CloneNotSupportedException {
    @SuppressWarnings("unchecked")
    final AbstractSearchQuery<T> clone = (AbstractSearchQuery<T>) super.clone();
    if (isBatchParamsPresent()) {
      clone.setBatchParams((AbstractBatchParams<?, ?>) getBatchParams().clone());
    }
    return clone;
  }

  public Person getUser() {
    return user;
  }

  public void setUser(Person user) {
    this.user = user;
  }

}

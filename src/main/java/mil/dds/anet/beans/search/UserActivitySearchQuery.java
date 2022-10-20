package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.time.Instant;
import java.util.Objects;

public class UserActivitySearchQuery extends AbstractSearchQuery<UserActivitySearchSortBy> {
  public enum SearchType {
    PERSON, ORGANIZATION, TOP_LEVEL_ORGANIZATION
  }

  public enum AggregationType {
    BY_OBJECT, OVER_TIME
  }

  public enum AggregationPeriod {
    DAY, WEEK, MONTH
  }

  @GraphQLQuery
  @GraphQLInputField
  private Instant startDate;

  @GraphQLQuery
  @GraphQLInputField
  private Instant endDate;

  @GraphQLQuery
  @GraphQLInputField
  private SearchType searchType;

  @GraphQLQuery
  @GraphQLInputField
  private AggregationType aggregationType;

  @GraphQLQuery
  @GraphQLInputField
  private AggregationPeriod aggregationPeriod;

  @GraphQLQuery
  @GraphQLInputField
  private Boolean showDeleted;

  @GraphQLIgnore(reason = "field is unused for this query")
  private Boolean inMyReports;

  public UserActivitySearchQuery() {
    super(UserActivitySearchSortBy.COUNT);
    this.setSortOrder(SortOrder.DESC);
  }

  public Instant getStartDate() {
    return startDate;
  }

  public void setStartDate(final Instant startDate) {
    this.startDate = startDate;
  }

  public Instant getEndDate() {
    return endDate;
  }

  public void setEndDate(final Instant endDate) {
    this.endDate = endDate;
  }

  public SearchType getSearchType() {
    return searchType;
  }

  public void setSearchType(SearchType searchType) {
    this.searchType = searchType;
  }

  public AggregationType getAggregationType() {
    return aggregationType;
  }

  public void setAggregationType(final AggregationType aggregationType) {
    this.aggregationType = aggregationType;
  }

  public AggregationPeriod getAggregationPeriod() {
    return aggregationPeriod;
  }

  public void setAggregationPeriod(AggregationPeriod aggregationPeriod) {
    this.aggregationPeriod = aggregationPeriod;
  }

  public boolean getShowDeleted() {
    return Boolean.TRUE.equals(showDeleted);
  }

  public void setShowDeleted(Boolean showDeleted) {
    this.showDeleted = showDeleted;
  }

  @Override
  public int hashCode() {
    return Objects.hash(super.hashCode(), startDate, endDate, searchType, aggregationType,
        aggregationPeriod, showDeleted);
  }

  @Override
  public boolean equals(final Object obj) {
    if (this == obj) {
      return true;
    }
    if (!(obj instanceof UserActivitySearchQuery)) {
      return false;
    }
    if (!super.equals(obj)) {
      return false;
    }
    final UserActivitySearchQuery other = (UserActivitySearchQuery) obj;
    return Objects.equals(getStartDate(), other.getStartDate())
        && Objects.equals(getEndDate(), other.getEndDate())
        && getSearchType() == other.getSearchType()
        && getAggregationType() == other.getAggregationType()
        && getAggregationPeriod() == other.getAggregationPeriod()
        && Objects.equals(getShowDeleted(), other.getShowDeleted());
  }

  @Override
  public UserActivitySearchQuery clone() throws CloneNotSupportedException {
    return (UserActivitySearchQuery) super.clone();
  }
}

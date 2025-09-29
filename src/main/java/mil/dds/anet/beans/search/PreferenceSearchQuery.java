package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;

public class PreferenceSearchQuery extends SubscribableObjectSearchQuery<PreferenceSearchSortBy> {

  @GraphQLQuery
  @GraphQLInputField
  String category;

  public PreferenceSearchQuery() {
    super(PreferenceSearchSortBy.CATEGORY);
    this.setPageSize(0);
  }

  @GraphQLQuery
  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  @Override
  public PreferenceSearchQuery clone() throws CloneNotSupportedException {
    return (PreferenceSearchQuery) super.clone();
  }
}

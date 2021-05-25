package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;

public class LocationSearchQuery extends AbstractSearchQuery<LocationSearchSortBy> {

  @GraphQLQuery
  @GraphQLInputField
  String type;

  public LocationSearchQuery() {
    super(LocationSearchSortBy.NAME);
  }

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  @Override
  public LocationSearchQuery clone() throws CloneNotSupportedException {
    return (LocationSearchQuery) super.clone();
  }
}

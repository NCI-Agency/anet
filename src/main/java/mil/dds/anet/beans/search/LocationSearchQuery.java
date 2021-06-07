package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import mil.dds.anet.beans.Location.LocationType;

public class LocationSearchQuery extends AbstractSearchQuery<LocationSearchSortBy> {

  @GraphQLQuery
  @GraphQLInputField
  private LocationType type;

  public LocationSearchQuery() {
    super(LocationSearchSortBy.NAME);
  }

  public LocationType getType() {
    return type;
  }

  public void setType(LocationType type) {
    this.type = type;
  }

  @Override
  public LocationSearchQuery clone() throws CloneNotSupportedException {
    return (LocationSearchQuery) super.clone();
  }
}

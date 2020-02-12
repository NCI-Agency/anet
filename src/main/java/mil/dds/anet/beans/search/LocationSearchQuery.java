package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import mil.dds.anet.beans.Location.LocationStatus;

public class LocationSearchQuery extends AbstractSearchQuery<LocationSearchSortBy> {

  @GraphQLQuery
  @GraphQLInputField
  private LocationStatus status;

  public LocationSearchQuery() {
    super(LocationSearchSortBy.NAME);
  }

  public LocationStatus getStatus() {
    return status;
  }

  public void setStatus(LocationStatus status) {
    this.status = status;
  }

}

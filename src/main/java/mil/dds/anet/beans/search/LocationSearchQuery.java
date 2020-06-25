package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;

public class LocationSearchQuery extends AbstractSearchQuery<LocationSearchSortBy> {

  @GraphQLQuery
  @GraphQLInputField
  private String withinPolygon;

  public LocationSearchQuery() {
    super(LocationSearchSortBy.NAME);
  }

  public String getWithinPolygon() {
    return withinPolygon;
  }

  public void setWithinPolygon(String withinPolygon) {
    this.withinPolygon = withinPolygon;
  }

  @Override
  public LocationSearchQuery clone() throws CloneNotSupportedException {
    return (LocationSearchQuery) super.clone();
  }

}

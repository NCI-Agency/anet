package mil.dds.anet.beans.search;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.ArrayList;
import java.util.List;
import mil.dds.anet.beans.Location.LocationType;

public class LocationSearchQuery extends SubscribableObjectSearchQuery<LocationSearchSortBy> {

  @GraphQLQuery
  @GraphQLInputField
  private LocationType type;
  @GraphQLQuery
  @GraphQLInputField
  private List<String> locationUuid;
  @GraphQLQuery
  @GraphQLInputField
  private String trigram;
  @GraphQLQuery
  @GraphQLInputField
  private RecurseStrategy locationRecurseStrategy;
  @GraphQLQuery
  @GraphQLInputField
  private BoundingBox boundingBox;

  public LocationSearchQuery() {
    super(LocationSearchSortBy.NAME);
  }

  public LocationType getType() {
    return type;
  }

  public void setType(LocationType type) {
    this.type = type;
  }

  public List<String> getLocationUuid() {
    return locationUuid;
  }

  public void setLocationUuid(List<String> locationUuid) {
    this.locationUuid = locationUuid;
  }

  public String getTrigram() {
    return trigram;
  }

  public void setTrigram(String trigram) {
    this.trigram = trigram;
  }

  public RecurseStrategy getLocationRecurseStrategy() {
    return locationRecurseStrategy;
  }

  public void setLocationRecurseStrategy(RecurseStrategy locationRecurseStrategy) {
    this.locationRecurseStrategy = locationRecurseStrategy;
  }

  public BoundingBox getBoundingBox() {
    return boundingBox;
  }

  public void setBoundingBox(BoundingBox boundingBox) {
    this.boundingBox = boundingBox;
  }

  @Override
  public LocationSearchQuery clone() throws CloneNotSupportedException {
    final LocationSearchQuery clone = (LocationSearchQuery) super.clone();
    if (locationUuid != null) {
      clone.setLocationUuid(new ArrayList<>(locationUuid));
    }
    if (boundingBox != null) {
      clone.setBoundingBox((BoundingBox) boundingBox.clone());
    }
    return clone;
  }
}

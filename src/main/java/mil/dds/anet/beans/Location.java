package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.Objects;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;

public class Location extends AbstractAnetBean implements SubscribableObject {

  /** pseudo uuid to represent 'no location' */
  @GraphQLIgnore
  public static final String DUMMY_LOCATION_UUID = "-1";

  public static enum LocationStatus {
    ACTIVE, INACTIVE
  }

  private String name;
  private LocationStatus status;
  private Double lat;
  private Double lng;

  @GraphQLQuery(name = "name")
  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = Utils.trimStringReturnNull(name);
  }

  @GraphQLQuery(name = "status")
  public LocationStatus getStatus() {
    return status;
  }

  public void setStatus(LocationStatus status) {
    this.status = status;
  }

  @GraphQLQuery(name = "lat")
  public Double getLat() {
    return lat;
  }

  public void setLat(Double lat) {
    this.lat = lat;
  }

  @GraphQLQuery(name = "lng")
  public Double getLng() {
    return lng;
  }

  public void setLng(Double lng) {
    this.lng = lng;
  }

  @Override
  public boolean equals(Object o) {
    if (o == null || o.getClass() != this.getClass()) {
      return false;
    }
    Location l = (Location) o;
    return Objects.equals(l.getUuid(), uuid) && Objects.equals(l.getName(), name)
        && Objects.equals(l.getStatus(), status) && Objects.equals(l.getLat(), lat)
        && Objects.equals(l.getLng(), lng) && Objects.equals(l.getCreatedAt(), createdAt);
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, name, status, lat, lng, createdAt);
  }

  @Override
  public String toString() {
    return String.format("(%s) - %s [%f, %f]", uuid, name, lat, lng);
  }

}

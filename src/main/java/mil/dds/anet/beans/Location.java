package mil.dds.anet.beans;

import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.util.Objects;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;

public class Location extends AbstractAnetBean {

  /** Pseudo uuid to represent 'no location'. */
  public static final String DUMMY_LOCATION_UUID = "-1";

  public static enum LocationStatus {
    ACTIVE, INACTIVE
  }

  @GraphQLQuery
  @GraphQLInputField
  private String name;
  @GraphQLQuery
  @GraphQLInputField
  private LocationStatus status;
  @GraphQLQuery
  @GraphQLInputField
  private Double lat;
  @GraphQLQuery
  @GraphQLInputField
  private Double lng;

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = Utils.trimStringReturnNull(name);
  }

  public LocationStatus getStatus() {
    return status;
  }

  public void setStatus(LocationStatus status) {
    this.status = status;
  }

  public Double getLat() {
    return lat;
  }

  public void setLat(Double lat) {
    this.lat = lat;
  }

  public Double getLng() {
    return lng;
  }

  public void setLng(Double lng) {
    this.lng = lng;
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof Location)) {
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

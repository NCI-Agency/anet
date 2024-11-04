package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.time.Instant;
import java.util.Objects;
import mil.dds.anet.graphql.AllowUnverifiedUsers;
import mil.dds.anet.views.AbstractAnetBean;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class EmailAddress extends AbstractAnetBean {
  @GraphQLQuery
  @GraphQLInputField
  private String network;
  @GraphQLQuery
  @GraphQLInputField
  private String address;
  // database-only fields
  private String relatedObjectType;
  private String relatedObjectUuid;

  public EmailAddress() {}

  public EmailAddress(final String network, final String address) {
    this.network = network;
    this.address = address;
  }

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public String getUuid() {
    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
        "no UUID field on EmailAddress");
  }

  @Override
  public void setUuid(String uuid) {
    // just ignore
  }

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public Instant getCreatedAt() {
    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
        "no createdAt field on EmailAddress");
  }

  @Override
  public void setCreatedAt(Instant createdAt) {
    // just ignore
  }

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public Instant getUpdatedAt() {
    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
        "no updatedAt field on EmailAddress");
  }

  @Override
  public void setUpdatedAt(Instant updatedAt) {
    // just ignore
  }

  @AllowUnverifiedUsers
  public String getNetwork() {
    return network;
  }

  public void setNetwork(String network) {
    this.network = network;
  }

  @AllowUnverifiedUsers
  public String getAddress() {
    return address;
  }

  public void setAddress(String address) {
    this.address = address;
  }

  public String getRelatedObjectType() {
    return relatedObjectType;
  }

  public void setRelatedObjectType(String relatedObjectType) {
    this.relatedObjectType = relatedObjectType;
  }

  public String getRelatedObjectUuid() {
    return relatedObjectUuid;
  }

  public void setRelatedObjectUuid(String relatedObjectUuid) {
    this.relatedObjectUuid = relatedObjectUuid;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (!(o instanceof EmailAddress that)) {
      return false;
    }
    return Objects.equals(network, that.network) && Objects.equals(address, that.address)
        && Objects.equals(relatedObjectType, that.relatedObjectType)
        && Objects.equals(relatedObjectUuid, that.relatedObjectUuid);
  }

  @Override
  public int hashCode() {
    return Objects.hash(network, address, relatedObjectType, relatedObjectUuid);
  }
}

package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.time.Instant;
import mil.dds.anet.views.AbstractAnetBean;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class AccessTokenActivity extends AbstractAnetBean {
  @GraphQLQuery
  private String accessTokenUuid;
  @GraphQLQuery
  private Instant visitedAt;
  @GraphQLQuery
  private String remoteAddress;

  public AccessTokenActivity() {}

  public AccessTokenActivity(String accessTokenUuid, Instant visitedAt, String remoteAddress) {
    this.accessTokenUuid = accessTokenUuid;
    this.visitedAt = visitedAt;
    this.remoteAddress = remoteAddress;
  }

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public String getUuid() {
    throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
        "no uuid field on AccessTokenActivity");

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
        "no createdAt field on AccessTokenActivity");
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
        "no updatedAt field on AccessTokenActivity");
  }

  @Override
  public void setUpdatedAt(Instant updatedAt) {
    // just ignore
  }

  public String getAccessTokenUuid() {
    return accessTokenUuid;
  }

  public void setAccessTokenUuid(String accessTokenUuid) {
    this.accessTokenUuid = accessTokenUuid;
  }

  public Instant getVisitedAt() {
    return visitedAt;
  }

  public void setVisitedAt(Instant visitedAt) {
    this.visitedAt = visitedAt;
  }

  public String getRemoteAddress() {
    return remoteAddress;
  }

  public void setRemoteAddress(String remoteAddress) {
    this.remoteAddress = remoteAddress;
  }
}

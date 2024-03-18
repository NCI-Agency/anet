package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import jakarta.ws.rs.WebApplicationException;
import java.time.Instant;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class GenericRelatedObject extends AbstractAnetBean {

  @GraphQLQuery
  @GraphQLInputField
  private String objectUuid;
  @GraphQLQuery
  @GraphQLInputField
  private String relatedObjectType;
  @GraphQLQuery
  @GraphQLInputField
  private String relatedObjectUuid;
  // annotated below
  private RelatableObject relatedObject;

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public String getUuid() {
    throw new WebApplicationException("no UUID field on GenericRelatedObject");
  }

  @Override
  public void setUuid(String uuid) {
    // just ignore
  }

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public Instant getCreatedAt() {
    throw new WebApplicationException("no createdAt field on GenericRelatedObject");
  }

  @Override
  public void setCreatedAt(Instant createdAt) {
    // just ignore
  }

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public Instant getUpdatedAt() {
    throw new WebApplicationException("no updatedAt field on GenericRelatedObject");
  }

  @Override
  public void setUpdatedAt(Instant updatedAt) {
    // just ignore
  }

  public String getObjectUuid() {
    return objectUuid;
  }

  public void setObjectUuid(String objectUuid) {
    this.objectUuid = objectUuid;
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

  @GraphQLQuery(name = "relatedObject")
  public CompletableFuture<RelatableObject> loadRelatedObject(
      @GraphQLRootContext Map<String, Object> context) {
    if (relatedObject != null) {
      return CompletableFuture.completedFuture(relatedObject);
    }
    return new UuidFetcher<>()
        .load(context, IdDataLoaderKey.valueOfTableName(relatedObjectType), relatedObjectUuid)
        .thenApply(o -> {
          relatedObject = (RelatableObject) o;
          return relatedObject;
        });
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (!(o instanceof GenericRelatedObject that))
      return false;
    return Objects.equals(objectUuid, that.objectUuid)
        && Objects.equals(relatedObjectType, that.relatedObjectType)
        && Objects.equals(relatedObjectUuid, that.relatedObjectUuid);
  }

  @Override
  public int hashCode() {
    return Objects.hash(objectUuid, relatedObjectType, relatedObjectUuid);
  }
}

package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import javax.ws.rs.WebApplicationException;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class AttachmentRelatedObject extends AbstractAnetBean {
  @GraphQLQuery
  @GraphQLInputField
  private String attachmentUuid;

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
    throw new WebApplicationException("no UUID field on AttachmentRelatedObject");
  }

  @Override
  public void setUuid(String uuid) {
    // just ignore
  }

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public Instant getCreatedAt() {
    throw new WebApplicationException("no createdAt field on AttachmentRelatedObject");
  }

  @Override
  public void setCreatedAt(Instant createdAt) {
    // just ignore
  }

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public Instant getUpdatedAt() {
    throw new WebApplicationException("no updatedAt field on AttachmentRelatedObject");
  }

  @Override
  public void setUpdatedAt(Instant updatedAt) {
    // just ignore
  }

  public String getAttachmentUuid() {
    return attachmentUuid;
  }

  public void setAttachmentUuid(String attachmentUuid) {
    this.attachmentUuid = attachmentUuid;
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
    return new UuidFetcher<AbstractAnetBean>()
        .load(context, IdDataLoaderKey.valueOfTableName(relatedObjectType), relatedObjectUuid)
        .thenApply(o -> {
          relatedObject = (RelatableObject) o;
          return relatedObject;
        });
  }

}

package mil.dds.anet.views;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.time.Instant;

public abstract class AbstractAnetBean {

  @GraphQLQuery
  @GraphQLInputField
  protected String uuid;
  @GraphQLQuery
  @GraphQLInputField
  protected Instant createdAt;
  @GraphQLQuery
  @GraphQLInputField
  protected Instant updatedAt;
  // annotated below
  private String batchUuid;
  private Boolean isSubscribed;

  public AbstractAnetBean() {
    uuid = null;
  }

  public String getUuid() {
    return uuid;
  }

  public void setUuid(String uuid) {
    this.uuid = uuid;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }

  @JsonIgnore
  public String getBatchUuid() {
    return batchUuid;
  }

  @JsonIgnore
  public void setBatchUuid(String batchUuid) {
    this.batchUuid = batchUuid;
  }

  @GraphQLQuery(name = "isSubscribed")
  public synchronized Boolean isSubscribed(@GraphQLRootContext Map<String, Object> context) {
    if (isSubscribed == null) {
      isSubscribed =
          AnetObjectEngine.getInstance().getSubscriptionDao().isSubscribedObject(context, uuid);
    }
    return isSubscribed;
  }

}

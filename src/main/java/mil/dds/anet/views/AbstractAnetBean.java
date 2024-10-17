package mil.dds.anet.views;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import java.time.Instant;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.config.ApplicationContextProvider;

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

  protected AnetObjectEngine engine() {
    return ApplicationContextProvider.getEngine();
  }

}

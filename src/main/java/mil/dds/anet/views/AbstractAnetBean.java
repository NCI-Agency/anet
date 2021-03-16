package mil.dds.anet.views;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Note;

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
  private List<Note> notes;
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

  @GraphQLQuery(name = "notes")
  public CompletableFuture<List<Note>> loadNotes(@GraphQLRootContext Map<String, Object> context) {
    if (notes != null) {
      return CompletableFuture.completedFuture(notes);
    }
    return AnetObjectEngine.getInstance().getNoteDao().getNotesForRelatedObject(context, uuid)
        .thenApply(o -> {
          notes = o;
          return o;
        });
  }

  public List<Note> getNotes() {
    return notes;
  }

  @GraphQLInputField(name = "notes")
  public void setNotes(List<Note> notes) {
    this.notes = notes;
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

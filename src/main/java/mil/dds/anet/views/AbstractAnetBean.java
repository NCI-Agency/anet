package mil.dds.anet.views;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.beans.Note;

public abstract class AbstractAnetBean {

  protected String uuid;
  protected Instant createdAt;
  protected Instant updatedAt;
  private List<Note> notes;
  private String batchUuid;

  public AbstractAnetBean() {
    uuid = null;
  }

  @GraphQLQuery(name = "uuid")
  public String getUuid() {
    return uuid;
  }

  public void setUuid(String uuid) {
    this.uuid = uuid;
  }

  @GraphQLQuery(name = "createdAt")
  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  @GraphQLQuery(name = "updatedAt")
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

  @GraphQLIgnore
  public List<Note> getNotes() {
    return notes;
  }

  public void setNotes(List<Note> notes) {
    this.notes = notes;
  }

  @JsonIgnore
  @GraphQLIgnore
  public String getBatchUuid() {
    return batchUuid;
  }

  @JsonIgnore
  @GraphQLIgnore
  public void setBatchUuid(String batchUuid) {
    this.batchUuid = batchUuid;
  }

}

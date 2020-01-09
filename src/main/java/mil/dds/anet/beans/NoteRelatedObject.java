package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import javax.ws.rs.WebApplicationException;
import mil.dds.anet.views.AbstractAnetBean;

public class NoteRelatedObject extends AbstractAnetBean {

  @GraphQLQuery
  @GraphQLInputField
  private String noteUuid;
  @GraphQLQuery
  @GraphQLInputField
  private String relatedObjectType;
  @GraphQLQuery
  @GraphQLInputField
  private String relatedObjectUuid;

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public String getUuid() {
    throw new WebApplicationException("no UUID field on NoteRelatedObject");
  }

  @Override
  public void setUuid(String uuid) {
    // just ignore
  }

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public Instant getCreatedAt() {
    throw new WebApplicationException("no createdAt field on NoteRelatedObject");
  }

  @Override
  public void setCreatedAt(Instant createdAt) {
    // just ignore
  }

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public Instant getUpdatedAt() {
    throw new WebApplicationException("no updatedAt field on NoteRelatedObject");
  }

  @Override
  public void setUpdatedAt(Instant updatedAt) {
    // just ignore
  }

  @Override
  public CompletableFuture<List<Note>> loadNotes(@GraphQLRootContext Map<String, Object> context) {
    throw new WebApplicationException("no notes field on NoteRelatedObject");
  }

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public List<Note> getNotes() {
    throw new WebApplicationException("no notes field on NoteRelatedObject");
  }

  @Override
  @JsonIgnore
  @GraphQLIgnore
  public void setNotes(List<Note> notes) {
    // just ignore
  }

  public String getNoteUuid() {
    return noteUuid;
  }

  public void setNoteUuid(String noteUuid) {
    this.noteUuid = noteUuid;
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

}

package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.AnetObjectEngine;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Note extends AbstractAnetBean {

  public static enum NoteType {
    FREE_TEXT, CHANGE_RECORD, PARTNER_ASSESSMENT, ASSESSMENT
  }

  @GraphQLQuery
  @GraphQLInputField
  private NoteType type;
  @GraphQLQuery
  @GraphQLInputField
  private String text;
  // annotated below
  private ForeignObjectHolder<Person> author = new ForeignObjectHolder<>();
  // annotated below
  private List<NoteRelatedObject> noteRelatedObjects;

  public NoteType getType() {
    return type;
  }

  public void setType(NoteType type) {
    this.type = type;
  }

  public String getText() {
    return text;
  }

  public void setText(String text) {
    this.text = Utils.trimStringReturnNull(text);
  }

  @GraphQLQuery(name = "author")
  public CompletableFuture<Person> loadAuthor(@GraphQLRootContext Map<String, Object> context) {
    if (author.hasForeignObject()) {
      return CompletableFuture.completedFuture(author.getForeignObject());
    }
    return new UuidFetcher<Person>().load(context, IdDataLoaderKey.PEOPLE, author.getForeignUuid())
        .thenApply(o -> {
          author.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  public void setAuthorUuid(String authorUuid) {
    this.author = new ForeignObjectHolder<>(authorUuid);
  }

  @JsonIgnore
  public String getAuthorUuid() {
    return author.getForeignUuid();
  }

  @GraphQLInputField(name = "author")
  public void setAuthor(Person author) {
    this.author = new ForeignObjectHolder<>(author);
  }

  public Person getAuthor() {
    return author.getForeignObject();
  }

  @GraphQLQuery(name = "noteRelatedObjects")
  public CompletableFuture<List<NoteRelatedObject>> loadNoteRelatedObjects(
      @GraphQLRootContext Map<String, Object> context) {
    if (noteRelatedObjects != null) {
      return CompletableFuture.completedFuture(noteRelatedObjects);
    }
    return AnetObjectEngine.getInstance().getNoteDao().getRelatedObjects(context, this)
        .thenApply(o -> {
          noteRelatedObjects = o;
          return o;
        });
  }

  @GraphQLInputField(name = "noteRelatedObjects")
  public void setNoteRelatedObjects(List<NoteRelatedObject> relatedObjects) {
    this.noteRelatedObjects = relatedObjects;
  }

  public List<NoteRelatedObject> getNoteRelatedObjects() {
    return noteRelatedObjects;
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof Note)) {
      return false;
    }
    final Note n = (Note) o;
    return Objects.equals(n.getUuid(), uuid) && Objects.equals(n.getAuthorUuid(), getAuthorUuid())
        && Objects.equals(n.getType(), type) && Objects.equals(n.getText(), text);
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, type, text);
  }

  @Override
  public String toString() {
    return String.format("[uuid:%s, author:%s]", uuid, getAuthorUuid());
  }

}

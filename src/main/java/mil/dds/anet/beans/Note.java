package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Note extends AbstractAnetBean implements RelatableObject {

  @GraphQLQuery
  @GraphQLInputField
  private String text;
  // annotated below
  private ForeignObjectHolder<Person> author = new ForeignObjectHolder<>();
  // annotated below
  private List<GenericRelatedObject> noteRelatedObjects;

  public String getText() {
    return text;
  }

  public void setText(String text) {
    this.text = Utils.trimStringReturnNull(text);
  }

  @GraphQLQuery(name = "author")
  public CompletableFuture<Person> loadAuthor(@GraphQLRootContext GraphQLContext context) {
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
  public CompletableFuture<List<GenericRelatedObject>> loadNoteRelatedObjects(
      @GraphQLRootContext GraphQLContext context) {
    if (noteRelatedObjects != null) {
      return CompletableFuture.completedFuture(noteRelatedObjects);
    }
    return engine().getNoteDao().getRelatedObjects(context, this).thenApply(o -> {
      noteRelatedObjects = o;
      return o;
    });
  }

  @GraphQLInputField(name = "noteRelatedObjects")
  public void setNoteRelatedObjects(List<GenericRelatedObject> relatedObjects) {
    this.noteRelatedObjects = relatedObjects;
  }

  public List<GenericRelatedObject> getNoteRelatedObjects() {
    return noteRelatedObjects;
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof Note)) {
      return false;
    }
    final Note n = (Note) o;
    return Objects.equals(n.getUuid(), uuid) && Objects.equals(n.getAuthorUuid(), getAuthorUuid())
        && Objects.equals(n.getText(), text);
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, text);
  }

  @Override
  public String toString() {
    return String.format("[uuid:%s, author:%s]", uuid, getAuthorUuid());
  }

}

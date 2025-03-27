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

public class Assessment extends AbstractAnetBean {

  @GraphQLQuery
  @GraphQLInputField
  private String assessmentKey;
  @GraphQLQuery
  @GraphQLInputField
  private String assessmentValues;
  // annotated below
  private ForeignObjectHolder<Person> author = new ForeignObjectHolder<>();
  // annotated below
  private List<GenericRelatedObject> assessmentRelatedObjects;

  public String getAssessmentKey() {
    return assessmentKey;
  }

  public void setAssessmentKey(String assessmentKey) {
    this.assessmentKey = assessmentKey;
  }

  public String getAssessmentValues() {
    return assessmentValues;
  }

  public void setAssessmentValues(String assessmentValues) {
    this.assessmentValues = Utils.trimStringReturnNull(assessmentValues);
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

  @GraphQLQuery(name = "assessmentRelatedObjects")
  public CompletableFuture<List<GenericRelatedObject>> loadAssessmentRelatedObjects(
      @GraphQLRootContext GraphQLContext context) {
    if (assessmentRelatedObjects != null) {
      return CompletableFuture.completedFuture(assessmentRelatedObjects);
    }
    return engine().getAssessmentDao().getRelatedObjects(context, this).thenApply(o -> {
      assessmentRelatedObjects = o;
      return o;
    });
  }

  @GraphQLInputField(name = "assessmentRelatedObjects")
  public void setAssessmentRelatedObjects(List<GenericRelatedObject> relatedObjects) {
    this.assessmentRelatedObjects = relatedObjects;
  }

  public List<GenericRelatedObject> getAssessmentRelatedObjects() {
    return assessmentRelatedObjects;
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof Assessment a)) {
      return false;
    }
    return Objects.equals(a.getUuid(), uuid) && Objects.equals(a.getAuthorUuid(), getAuthorUuid())
        && Objects.equals(a.getAssessmentKey(), assessmentKey)
        && Objects.equals(a.getAssessmentValues(), assessmentValues);
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, assessmentKey, assessmentValues);
  }

  @Override
  public String toString() {
    return String.format("[uuid:%s, author:%s]", uuid, getAuthorUuid());
  }

}

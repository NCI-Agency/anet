package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Comment extends AbstractAnetBean {

  @GraphQLQuery
  @GraphQLInputField
  private String reportUuid;
  // annotated below
  private ForeignObjectHolder<Person> author = new ForeignObjectHolder<>();
  @GraphQLQuery
  @GraphQLInputField
  private String text;

  public String getReportUuid() {
    return reportUuid;
  }

  public void setReportUuid(String reportUuid) {
    this.reportUuid = reportUuid;
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

  public Person getAuthor() {
    return author.getForeignObject();
  }

  @GraphQLInputField(name = "author")
  public void setAuthor(Person author) {
    this.author = new ForeignObjectHolder<>(author);
  }

  public String getText() {
    return text;
  }

  public void setText(String text) {
    this.text = Utils.trimStringReturnNull(text);
  }

  @Override
  public boolean equals(Object o) {
    if (!(o instanceof Comment)) {
      return false;
    }
    Comment c = (Comment) o;
    return Objects.equals(c.getUuid(), uuid) && Objects.equals(c.getAuthorUuid(), getAuthorUuid())
        && Objects.equals(c.getText(), text) && Objects.equals(c.getReportUuid(), reportUuid)
        && Objects.equals(c.getUpdatedAt(), updatedAt)
        && Objects.equals(c.getCreatedAt(), createdAt);
  }

  @Override
  public int hashCode() {
    return Objects.hash(uuid, author, createdAt, text, reportUuid, updatedAt);
  }

  @Override
  public String toString() {
    return String.format("[%s] - [Author:%s,Report:%s] - (%s)", uuid, getAuthorUuid(), reportUuid,
        text);
  }

}

package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import io.leangen.graphql.annotations.GraphQLIgnore;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.utils.Utils;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Comment extends AbstractAnetBean {

  private String reportUuid;

  private ForeignObjectHolder<Person> author = new ForeignObjectHolder<>();
  private String text;

  @GraphQLQuery(name = "reportUuid")
  public String getReportUuid() {
    return reportUuid;
  }

  public void setReportUuid(String reportUuid) {
    this.reportUuid = reportUuid;
  }

  @GraphQLQuery(name = "author")
  public CompletableFuture<Person> loadAuthor(@GraphQLRootContext Map<String, Object> context) {
    if (author.hasForeignObject()) {
      return CompletableFuture.completedFuture(author.getForeignObject());
    }
    return new UuidFetcher<Person>().load(context, "people", author.getForeignUuid())
        .thenApply(o -> {
          author.setForeignObject(o);
          return o;
        });
  }

  @JsonIgnore
  @GraphQLIgnore
  public void setAuthorUuid(String authorUuid) {
    this.author = new ForeignObjectHolder<>(authorUuid);
  }

  @JsonIgnore
  @GraphQLIgnore
  public String getAuthorUuid() {
    return author.getForeignUuid();
  }

  @GraphQLIgnore
  public Person getAuthor() {
    return author.getForeignObject();
  }

  public void setAuthor(Person author) {
    this.author = new ForeignObjectHolder<>(author);
  }

  @GraphQLQuery(name = "text")
  public String getText() {
    return text;
  }

  public void setText(String text) {
    this.text = Utils.trimStringReturnNull(text);
  }

  @Override
  public boolean equals(Object o) {
    if (o == null || o.getClass() != this.getClass()) {
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
    return String.format("[%s] - [Author:%s,Report:%d] - (%s)", uuid, getAuthorUuid(), reportUuid,
        text);
  }

}

package mil.dds.anet.beans;

import com.fasterxml.jackson.annotation.JsonIgnore;
import graphql.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLInputField;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.annotations.GraphQLRootContext;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import mil.dds.anet.utils.IdDataLoaderKey;
import mil.dds.anet.views.AbstractAnetBean;
import mil.dds.anet.views.UuidFetcher;

public class Attachment extends AbstractAnetBean {

  @GraphQLQuery
  @GraphQLInputField
  private String mimeType;

  @GraphQLQuery
  @GraphQLInputField
  private Long contentLength;

  @GraphQLQuery
  @GraphQLInputField
  private String fileName;

  @GraphQLQuery
  @GraphQLInputField
  private String description;

  @GraphQLQuery
  @GraphQLInputField
  private String classification;

  @GraphQLQuery
  @GraphQLInputField
  private String caption;

  // annotated below
  private ForeignObjectHolder<Person> author = new ForeignObjectHolder<>();

  // annotated below
  private List<GenericRelatedObject> attachmentRelatedObjects;

  public String getMimeType() {
    return mimeType;
  }

  public void setMimeType(String mimeType) {
    this.mimeType = mimeType;
  }

  public Long getContentLength() {
    return contentLength;
  }

  public void setContentLength(Long contentLength) {
    this.contentLength = contentLength;
  }

  public String getFileName() {
    return fileName;
  }

  public void setFileName(String fileName) {
    this.fileName = fileName;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public void setClassification(String classification) {
    this.classification = classification;
  }

  public String getClassification() {
    return classification;
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

  public String getCaption() {
    return caption;
  }

  public void setCaption(String caption) {
    this.caption = caption;
  }

  @GraphQLQuery(name = "attachmentRelatedObjects")
  public CompletableFuture<List<GenericRelatedObject>> loadAttachmentRelatedObjects(
      @GraphQLRootContext GraphQLContext context) {
    if (attachmentRelatedObjects != null) {
      return CompletableFuture.completedFuture(attachmentRelatedObjects);
    }
    return engine().getAttachmentDao().getRelatedObjects(context, this).thenApply(o -> {
      attachmentRelatedObjects = o;
      return o;
    });
  }

  public List<GenericRelatedObject> getAttachmentRelatedObjects() {
    return attachmentRelatedObjects;
  }

  @GraphQLInputField(name = "attachmentRelatedObjects")
  public void setAttachmentRelatedObjects(List<GenericRelatedObject> attachmentRelatedObjects) {
    this.attachmentRelatedObjects = attachmentRelatedObjects;
  }

  @Override
  public String toString() {
    return String.format("[uuid:%s, file name:%s, mime type:%s]", uuid, getFileName(),
        getMimeType());
  }

}
